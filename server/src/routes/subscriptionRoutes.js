const express = require("express");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Seller = require("../models/Seller");
const Subscription = require("../models/Subscription");
const auth = require("../middleware/auth");
const { sendOtpEmail } = require("../utils/mailer"); // Optional: for emails later

const router = express.Router();

const PLAN_PRICES = {
  STARTER: 999,
  GROWTH: 1499,
  BUSINESS: 2499,
};

// ─── GET /subscription/my — Get current subscription info (auth) ─────────────
router.get("/my", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId).select("currentPlan subscriptionStatus subscriptionEndDate trialEndDate storeEnabled");
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // We can also fetch the latest Subscription record if needed, but seller has the summary fields
    const activeSubscription = await Subscription.findOne({ seller: req.sellerId, status: "ACTIVE" }).sort({ createdAt: -1 });

    return res.json({
      seller: {
        currentPlan: seller.currentPlan,
        subscriptionStatus: seller.subscriptionStatus,
        subscriptionEndDate: seller.subscriptionEndDate,
        trialEndDate: seller.trialEndDate,
        storeEnabled: seller.storeEnabled,
      },
      subscription: activeSubscription
    });
  } catch (error) {
    console.error("[GET /subscription/my error]", error);
    return res.status(500).json({ message: "Unable to fetch subscription details" });
  }
});

// ─── POST /subscription/purchase — Initiate purchase (auth) ──────────────────
router.post("/purchase", auth, async (req, res) => {
  try {
    const { planType } = req.body; // "STARTER", "GROWTH", "BUSINESS"

    if (!PLAN_PRICES[planType]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const amount = PLAN_PRICES[planType];
    const amountPaise = amount * 100;

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
        },
      };
      const order = await razorpay.orders.create(options);
      orderId = order.id;
    }

    // Create a PENDING subscription record
    const subscription = await Subscription.create({
      seller: seller._id,
      planType,
      status: "PENDING",
      startDate: new Date(),
      endDate: new Date(), // Will be updated on verification
      orderId,
      amountPaid: amount,
    });

    return res.json({
      orderId,
      amountPaise,
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

    // Update Subscription Record
    const seller = await Seller.findById(req.sellerId);
    const now = new Date();
    
    // Renewal starts from current expiry date if active. If already expired, start from purchase date.
    let startDate = now;
    if (seller.subscriptionStatus === "ACTIVE" && seller.subscriptionEndDate && seller.subscriptionEndDate > now) {
      startDate = new Date(seller.subscriptionEndDate);
    }
    
    // Add 30 days
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    subscription.status = "ACTIVE";
    subscription.paymentId = razorpay_payment_id || `mock_payment_${Date.now()}`;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    // Update Seller Record
    seller.currentPlan = subscription.planType;
    seller.subscriptionStatus = "ACTIVE";
    seller.subscriptionEndDate = endDate;
    seller.storeEnabled = true;
    seller.subscriptionExpiredPopupShown = false;
    await seller.save();

    return res.json({ message: "Subscription activated successfully", subscription, seller });
  } catch (error) {
    console.error("[POST /subscription/verify error]", error);
    return res.status(500).json({ message: "Unable to verify payment and activate subscription" });
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
