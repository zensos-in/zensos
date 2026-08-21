/**
 * Direct vendor settlement helpers.
 *
 * New orders transfer the stored vendor payable amount to the vendor linked
 * account immediately after payment.captured. The remaining platform commission
 * stays in the platform Razorpay account.
 */

function getSubOrderTotalPaise(subOrder) {
  if (Number(subOrder.grossAmountPaise) > 0) {
    return Math.round(Number(subOrder.grossAmountPaise));
  }
  return Math.round((Number(subOrder.amount) + Number(subOrder.deliveryCharge || 0)) * 100);
}

/** Vendor Route transfer amount in paise. */
function getVendorTransferAmountPaise(subOrder) {
  if (Number(subOrder.vendorAmountPaise) > 0) {
    return Math.round(Number(subOrder.vendorAmountPaise));
  }

  const totalPaise = getSubOrderTotalPaise(subOrder);
  const commissionPaise = Math.max(
    0,
    Number(subOrder.platformFeePaise) || Number(subOrder.commissionAmountPaise) || 0
  );
  return Math.max(0, totalPaise - commissionPaise);
}

function hasProcessedTransfer(subOrder) {
  return Boolean(subOrder.transferId) && subOrder.transferStatus === "processed";
}

async function executeVendorTransfer(razorpay, { paymentId, seller, subOrder }) {
  if (hasProcessedTransfer(subOrder)) {
    return { skipped: true, reason: "already_processed", transferId: subOrder.transferId };
  }

  const transferAmountPaise = getVendorTransferAmountPaise(subOrder);
  if (transferAmountPaise <= 0) {
    throw new Error(`Invalid transfer amount for order ${subOrder._id}`);
  }

  const transferResponse = await razorpay.payments.transfer(paymentId, {
    transfers: [
      {
        account: seller.razorpayAccountId,
        amount: transferAmountPaise,
        currency: "INR",
        on_hold: 0,
      },
    ],
  });

  const transferResult = transferResponse.items?.[0] || transferResponse;
  return {
    skipped: false,
    transferId: transferResult.id,
    transferAmountPaise,
    transferResult,
  };
}

async function recordVendorTransferLedger({ subOrder, seller, transferId, transferAmountPaise }) {
  const TransactionLedger = require("../models/TransactionLedger");

  const existing = await TransactionLedger.findOne({
    orderId: subOrder._id,
    sellerId: seller._id,
    amountPaise: transferAmountPaise,
    type: "credit",
    purpose: "order_item_revenue",
  });
  if (existing) return existing;

  return TransactionLedger.create({
    orderId: subOrder._id,
    sellerId: seller._id,
    amountPaise: transferAmountPaise,
    type: "credit",
    purpose: "order_item_revenue",
    status: "settled",
    razorpayTransferId: transferId,
  });
}

async function recordPlatformCommissionLedger({ subOrder, status = "settled" }) {
  const TransactionLedger = require("../models/TransactionLedger");
  const amountPaise = Math.max(
    0,
    Number(subOrder.platformFeePaise) || Number(subOrder.commissionAmountPaise) || 0
  );
  if (amountPaise <= 0) return null;

  const existing = await TransactionLedger.findOne({
    orderId: subOrder._id,
    sellerId: null,
    amountPaise,
    type: "credit",
    purpose: "platform_commission",
  });
  if (existing) return existing;

  return TransactionLedger.create({
    orderId: subOrder._id,
    sellerId: null,
    amountPaise,
    type: "credit",
    purpose: "platform_commission",
    status,
    razorpayTransferId: subOrder.transferId || "",
  });
}

/**
 * Execute the full vendor Route transfer pipeline for one sub-order.
 *
 * This is the single source of truth for routing vendor funds.  It is called
 * from three places:
 *   1. verify-payment (synchronous, right after checkout) — primary trigger
 *   2. payment.captured webhook               — authoritative / safety net
 *   3. Admin settlement-retry endpoint        — manual recovery
 *
 * All checks are idempotent: calling this multiple times on the same sub-order
 * is safe — it will skip and return early once a transfer is already processed.
 */
async function processSubOrderTransfer(subOrder, razorpayPaymentId) {
  // Lazy-require to avoid any circular-dependency risk at module load time
  const razorpay = require("./razorpay");
  const Seller = require("../models/Seller");
  const Order = require("../models/Order");
  const { collectKycIssues, isPayoutEligible, recordComplianceEvent } = require("./kycCompliance");

  if (hasProcessedTransfer(subOrder)) {
    await recordPlatformCommissionLedger({ subOrder, status: "settled" });
    console.log(`[transfer] Skipping sub-order ${subOrder._id}: already processed (${subOrder.transferId})`);
    return;
  }

  // Atomic lock: prevent parallel webhook and verify-payment execution
  const lockedSubOrder = await Order.findOneAndUpdate(
    { _id: subOrder._id, transferStatus: { $nin: ["processed", "processing"] } },
    { $set: { transferStatus: "processing" } },
    { new: true }
  );

  if (!lockedSubOrder) {
    if (subOrder.transferStatus === "processed") {
      await recordPlatformCommissionLedger({ subOrder, status: "settled" });
    }
    console.log(`[transfer] Skipping sub-order ${subOrder._id}: concurrent transfer already handled.`);
    return;
  }

  const seller = await Seller.findById(subOrder.seller);
  if (!seller) {
    lockedSubOrder.transferStatus = "failed";
    lockedSubOrder.settlementStatus = "failed";
    await lockedSubOrder.save();
    console.error(`[transfer] Seller not found for sub-order: ${subOrder._id}`);
    return;
  }

  if (!seller.razorpayAccountId || seller.razorpayAccountStatus !== "active") {
    if (seller.approvalStatus === "approved") {
      try {
        const { provisionVendorLinkedAccount } = require("./razorpayLinkedAccount");
        console.log(`[transfer] Attempting auto-provisioning for approved seller ${seller.businessName}...`);
        await provisionVendorLinkedAccount(seller, { actor: "settlement-auto-provision" });
        await seller.save();
      } catch (err) {
        console.error(`[transfer] Auto-provisioning failed for ${seller.businessName}:`, err.message);
      }
    }
  }

  const targetOrder = lockedSubOrder;

  if (!seller.razorpayAccountId || seller.razorpayAccountStatus !== "active") {
    targetOrder.transferStatus = "failed";
    targetOrder.settlementStatus = "failed";
    await targetOrder.save();
    console.warn(`[transfer] Skipped: seller ${seller.businessName} has no active Razorpay linked account.`);
    return;
  }

  if (!isPayoutEligible(seller)) {
    targetOrder.transferStatus = "failed";
    targetOrder.settlementStatus = "failed";
    seller.payoutStatus = "blocked";
    recordComplianceEvent(seller, "route_transfer_blocked_incomplete_kyc", "system", {
      orderId: targetOrder._id.toString(),
      missingFields: collectKycIssues(seller, {
        requireVerifiedPan: true,
        requireVerifiedKyc: true,
        requireBank: true,
      }),
    });
    await Promise.all([targetOrder.save(), seller.save()]);
    console.warn(`[transfer] Blocked: seller ${seller.businessName} is not payout eligible.`);
    return;
  }

  try {
    const result = await executeVendorTransfer(razorpay, {
      paymentId: razorpayPaymentId,
      seller,
      subOrder: targetOrder,
    });

    if (result.skipped) {
      return;
    }

    targetOrder.transferId = result.transferId;
    targetOrder.transferStatus = "processed";
    targetOrder.settlementStatus = "processed";
    targetOrder.settlementReferenceIds = Array.from(
      new Set([...(targetOrder.settlementReferenceIds || []), result.transferId].filter(Boolean))
    );
    await targetOrder.save();

    await recordVendorTransferLedger({
      subOrder: targetOrder,
      seller,
      transferId: result.transferId,
      transferAmountPaise: result.transferAmountPaise,
    });
    await recordPlatformCommissionLedger({ subOrder: targetOrder, status: "settled" });

    console.log(
      `[transfer] Settled to ${seller.businessName} (${seller.razorpayAccountId}): ${result.transferAmountPaise} paise via pay_${razorpayPaymentId}`
    );
  } catch (err) {
    console.error(`[transfer] Route API failed for sub-order ${subOrder._id}:`, err.message);
    subOrder.transferStatus = "failed";
    subOrder.settlementStatus = "failed";
    await subOrder.save();
  }
}

module.exports = {
  getSubOrderTotalPaise,
  getVendorTransferAmountPaise,
  hasProcessedTransfer,
  executeVendorTransfer,
  processSubOrderTransfer,
  recordPlatformCommissionLedger,
  recordVendorTransferLedger,
};
