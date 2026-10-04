const express = require("express");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Seller = require("../models/Seller");
const Subscription = require("../models/Subscription");
const auth = require("../middleware/auth");
const { sendOtpEmail } = require("../utils/mailer"); // Optional: for emails later

const router = express.Router();

const GST_PERCENTAGE = 18;

const PLAN_PRICES = {
  STARTER: 999,
  GROWTH: 1499,
  BUSINESS: 2499,
};

// ─── GET /subscription/my — Get current subscription info (auth) ─────────────
router.get("/my", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId).select(
      "currentPlan billingCycle complimentaryOfferActive subscriptionStatus subscriptionEndDate trialEndDate storeEnabled"
    );
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Fetch latest Subscription record
    const activeSubscription = await Subscription.findOne({ seller: req.sellerId, status: "ACTIVE" }).sort({ createdAt: -1 });

    return res.json({
      seller: {
        currentPlan: seller.currentPlan,
        billingCycle: seller.billingCycle || "MONTHLY",
        complimentaryOfferActive: Boolean(seller.complimentaryOfferActive),
        subscriptionStatus: seller.subscriptionStatus,
        subscriptionEndDate: seller.subscriptionEndDate,
        trialEndDate: seller.trialEndDate,
        storeEnabled: seller.storeEnabled,
      },
      subscription: activeSubscription,
    });
  } catch (error) {
    console.error("[GET /subscription/my error]", error);
    return res.status(500).json({ message: "Unable to fetch subscription details" });
  }
});

// ─── POST /subscription/purchase — Initiate purchase (auth) ──────────────────
router.post("/purchase", auth, async (req, res) => {
  try {
    const { planType, billingCycle = "MONTHLY", durationMonths } = req.body; // "STARTER", "GROWTH", "BUSINESS"

    if (!PLAN_PRICES[planType]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const months = billingCycle === "QUARTERLY" || durationMonths === 3 ? 3 : (Number(durationMonths) || 1);
    const resolvedBillingCycle = months >= 3 ? "QUARTERLY" : "MONTHLY";
    const monthlyBaseAmount = PLAN_PRICES[planType];
    const baseAmount = monthlyBaseAmount * months;
    const gstAmount = Math.round(((baseAmount * GST_PERCENTAGE) / 100) * 100) / 100;
    const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;
    const amountPaise = Math.round(totalAmount * 100);

    const isComplimentaryEligible = months >= 3 && (planType === "GROWTH" || planType === "BUSINESS");

    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // In a real environment with Razorpay:
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock_id";
    let orderId = `mock_order_${Date.now()}`;

    if (!isMock) {
      const options = {
        amount: amountPaise,
        currency: "INR",
        receipt: `receipt_sub_${seller._id}`,
        notes: {
          sellerId: seller._id.toString(),
          planType,
          billingCycle: resolvedBillingCycle,
          durationMonths: String(months),
          complimentaryOfferActive: String(isComplimentaryEligible),
          monthlyBaseAmount: String(monthlyBaseAmount),
          baseAmount: String(baseAmount),
          gstAmount: String(gstAmount),
          totalAmount: String(totalAmount),
          gstPercentage: String(GST_PERCENTAGE),
        },
      };
      const order = await razorpay.orders.create(options);
      orderId = order.id;
    }

    // Create a PENDING subscription record
    const subscription = await Subscription.create({
      seller: seller._id,
      planType,
      billingCycle: resolvedBillingCycle,
      durationMonths: months,
      complimentaryOfferActive: isComplimentaryEligible,
      status: "PENDING",
      startDate: new Date(),
      endDate: new Date(), // Will be updated on verification
      orderId,
      amountPaid: totalAmount,
    });

    return res.json({
      orderId,
      amountPaise,
      baseAmount,
      gstAmount,
      totalAmount,
      durationMonths: months,
      billingCycle: resolvedBillingCycle,
      complimentaryOfferActive: isComplimentaryEligible,
      currency: "INR",
      subscriptionId: subscription._id,
      planType,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_id",
    });
  } catch (error) {
    console.error("[POST /subscription/purchase error]", error);
    return res.status(500).json({ message: "Unable to initiate subscription purchase" });
  }
});

// ─── HELPER: Activate Subscription Record ────────────────────────────────────
async function activateSubscriptionRecord(subscription, seller, paymentId) {
  const now = new Date();

  // Renewal starts from current expiry date if active. If already expired, start from purchase date.
  let startDate = now;
  if (seller.subscriptionStatus === "ACTIVE" && seller.subscriptionEndDate && seller.subscriptionEndDate > now) {
    startDate = new Date(seller.subscriptionEndDate);
  }

  // Add days based on subscription duration (30 days per month: 90 days for quarterly, 30 days for monthly)
  const durationMonths = subscription.durationMonths || (subscription.billingCycle === "QUARTERLY" ? 3 : 1);
  const durationDays = durationMonths * 30;
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const isComplimentaryEligible = durationMonths >= 3 && (subscription.planType === "GROWTH" || subscription.planType === "BUSINESS");

  subscription.status = "ACTIVE";
  subscription.paymentId = paymentId || `payment_${Date.now()}`;
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  subscription.complimentaryOfferActive = isComplimentaryEligible;
  await subscription.save();

  // Update Seller Record
  seller.currentPlan = subscription.planType;
  seller.billingCycle = subscription.billingCycle || (durationMonths >= 3 ? "QUARTERLY" : "MONTHLY");
  seller.complimentaryOfferActive = isComplimentaryEligible;
  seller.subscriptionStatus = "ACTIVE";
  seller.subscriptionEndDate = endDate;
  seller.storeEnabled = true;

  // ---------------------------------------------------------------------
  // Delivery‑Partner Add‑on carry‑over handling
  // ---------------------------------------------------------------------
  if (seller.deliveryAddonStatus === "ACTIVE" && seller.deliveryAddonExpiresAt) {
    const remainingMs = seller.deliveryAddonExpiresAt - now;
    if (remainingMs > 0) {
      const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      seller.deliveryAddonCarryoverDays = remainingDays;
    }
  }

  if (seller.deliveryAddonCarryoverDays && seller.deliveryAddonCarryoverDays > 0) {
    const addedMs = seller.deliveryAddonCarryoverDays * 24 * 60 * 60 * 1000;
    seller.deliveryAddonExpiresAt = new Date(endDate.getTime() + addedMs);
    seller.deliveryAddonCarryoverDays = 0;

    // Sync DeliverySubscription document
    const DeliverySubscription = require("../models/DeliverySubscription");
    await DeliverySubscription.updateOne(
      { seller: seller._id, status: "ACTIVE" },
      { $set: { expiresAt: seller.deliveryAddonExpiresAt, mainSubscriptionEndDate: endDate } }
    );
  }

  await seller.save();
  return { subscription, seller };
}

// ─── POST /subscription/verify — Verify payment (auth) ───────────────────────
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } = req.body;

    const subscription = await Subscription.findOne({ _id: subscriptionId, seller: req.sellerId });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription record not found" });
    }

    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock_id";

    if (!isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Payment signature verification failed" });
      }
    }

    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const result = await activateSubscriptionRecord(
      subscription,
      seller,
      razorpay_payment_id || `mock_payment_${Date.now()}`
    );

    return res.json({ message: "Subscription activated successfully", subscription: result.subscription, seller: result.seller });
  } catch (error) {
    console.error("[POST /subscription/verify error]", error);
    return res.status(500).json({ message: "Unable to verify payment and activate subscription" });
  }
});

// ─── POST /subscription/webhook — Razorpay Webhook for Subscriptions ─────────
router.post("/webhook", async (req, res) => {
  const eventId = req.headers["x-razorpay-event-id"] || req.body?.event_id;
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "zensos_webhook_secret_dev";
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!eventId) {
    return res.status(400).json({ message: "Missing event ID" });
  }

  const isMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock_id";
  if (!isMockMode) {
    if (!signature || !secret) {
      return res.status(400).json({ message: "Missing signature or webhook secret" });
    }
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");
    if (expectedSignature !== signature) {
      console.warn(`[Subscription Webhook Warning] Signature verification failed for event: ${eventId}`);
      return res.status(400).json({ message: "Invalid signature" });
    }
  }

  const WebhookLog = require("../models/WebhookLog");
  let webhookLog;
  try {
    webhookLog = await WebhookLog.create({
      eventId,
      eventType: req.body.event || "subscription_event",
      payload: req.body,
      processed: false,
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(`[Subscription Webhook] Duplicate event blocked: ${eventId}`);
      return res.status(200).json({ status: "already_processed" });
    }
    console.error("[Subscription Webhook Error] Logging failed:", error);
    return res.status(500).json({ message: "Webhook logging failed" });
  }

  try {
    const event = req.body.event;
    console.log(`[Subscription Webhook Logged] Event: ${event} (${eventId})`);

    if (event === "payment.captured" || event === "order.paid") {
      const payment = req.body.payload?.payment?.entity;
      const order = req.body.payload?.order?.entity;
      const razorpayOrderId = payment?.order_id || order?.id;
      const razorpayPaymentId = payment?.id || `webhook_payment_${Date.now()}`;

      if (razorpayOrderId) {
        const subscription = await Subscription.findOne({ orderId: razorpayOrderId });
        if (subscription && subscription.status !== "ACTIVE") {
          const seller = await Seller.findById(subscription.seller);
          if (seller) {
            await activateSubscriptionRecord(subscription, seller, razorpayPaymentId);
            console.log(`[Subscription Webhook] Successfully activated subscription for seller: ${seller._id}`);
          }
        }
      }
    }

    webhookLog.processed = true;
    webhookLog.processedAt = new Date();
    await webhookLog.save();
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error(`[Subscription Webhook Error] Processing failed for event ${eventId}:`, err);
    webhookLog.error = err.message;
    await webhookLog.save();
    return res.status(500).json({ message: "Subscription webhook processing failed" });
  }
});

// ─── GET /subscription/complimentary-offer/details — Get Offer Assets & Info ─
router.get("/complimentary-offer/details", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId).select(
      "currentPlan billingCycle complimentaryOfferActive complimentaryOfferDetails businessName phone businessEmail profileImageUrl"
    );
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    return res.json({
      complimentaryOfferActive: Boolean(seller.complimentaryOfferActive),
      currentPlan: seller.currentPlan,
      billingCycle: seller.billingCycle,
      details: seller.complimentaryOfferDetails || {},
    });
  } catch (error) {
    console.error("[GET /subscription/complimentary-offer/details error]", error);
    return res.status(500).json({ message: "Unable to fetch offer details" });
  }
});

// ─── POST /subscription/complimentary-offer/assets — Submit Brand Assets ─────
router.post("/complimentary-offer/assets", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (!seller.complimentaryOfferActive) {
      return res.status(403).json({ message: "Complimentary offer is not active for this account" });
    }

    const {
      brandDescription = "",
      productImages = [],
      uspHighlights = "",
      targetAudience = "",
      socialHandle = "",
      additionalNotes = "",
    } = req.body;

    const currentDetails = seller.complimentaryOfferDetails || {};

    seller.complimentaryOfferDetails = {
      ...currentDetails,
      status: currentDetails.status === "in_production" || currentDetails.status === "reels_published" || currentDetails.status === "completed"
        ? currentDetails.status
        : "assets_submitted",
      assetsSubmittedAt: currentDetails.assetsSubmittedAt || new Date(),
      brandDescription: String(brandDescription).trim(),
      productImages: Array.isArray(productImages) ? productImages.filter(Boolean) : [],
      uspHighlights: String(uspHighlights).trim(),
      targetAudience: String(targetAudience).trim(),
      socialHandle: String(socialHandle).trim(),
      additionalNotes: String(additionalNotes).trim(),
      updatedAt: new Date(),
    };

    await seller.save();

    return res.json({
      message: "Partner Spotlight Offer assets submitted successfully",
      details: seller.complimentaryOfferDetails,
    });
  } catch (error) {
    console.error("[POST /subscription/complimentary-offer/assets error]", error);
    return res.status(500).json({ message: "Unable to submit brand assets" });
  }
});

// ─── POST /subscription/dismiss-popup ────────────────────────────────────────
router.post("/dismiss-popup", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    seller.subscriptionExpiredPopupShown = true;
    await seller.save();
    return res.json({ message: "Popup dismissed" });
  } catch (error) {
    console.error("[POST /subscription/dismiss-popup error]", error);
    return res.status(500).json({ message: "Unable to dismiss popup" });
  }
});

module.exports = router;
module.exports.activateSubscriptionRecord = activateSubscriptionRecord;
