const express = require("express");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Seller = require("../models/Seller");
const DeliverySubscription = require("../models/DeliverySubscription");
const auth = require("../middleware/auth");

const router = express.Router();

const DELIVERY_ADDON_PRICE = 200; // Flat ₹200 charge

// ─── GET /api/delivery-addon/status ──────────────────────────────────────────
router.get("/status", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId).select(
      "currentPlan subscriptionStatus subscriptionEndDate deliveryAddonStatus deliveryAddonExpiresAt preferredLogisticsProvider shiprocketEmail shiprocketAccountStatus nimbuspostEmail nimbuspostAccountStatus velocityEmail velocityAccountStatus shiprocketPickupLocation courierPreference businessName businessAddress businessGST phone businessEmail"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const now = new Date();
    let isAddonActive = false;

    if (
      seller.deliveryAddonStatus === "ACTIVE" &&
      seller.deliveryAddonExpiresAt &&
      new Date(seller.deliveryAddonExpiresAt) > now &&
      seller.subscriptionStatus === "ACTIVE"
    ) {
      isAddonActive = true;
    }

    const latestAddonDoc = await DeliverySubscription.findOne({ seller: req.sellerId })
      .sort({ createdAt: -1 });

    return res.json({
      seller: {
        currentPlan: seller.currentPlan,
        subscriptionStatus: seller.subscriptionStatus,
        subscriptionEndDate: seller.subscriptionEndDate,
        deliveryAddonStatus: isAddonActive ? "ACTIVE" : seller.deliveryAddonStatus,
        deliveryAddonExpiresAt: seller.deliveryAddonExpiresAt,
        preferredLogisticsProvider: seller.preferredLogisticsProvider || "SHIPROCKET",
        shiprocketEmail: seller.shiprocketEmail || "",
        shiprocketAccountStatus: seller.shiprocketAccountStatus || "UNCONFIGURED",
        nimbuspostEmail: seller.nimbuspostEmail || "",
        nimbuspostAccountStatus: seller.nimbuspostAccountStatus || "UNCONFIGURED",
        velocityEmail: seller.velocityEmail || "",
        velocityAccountStatus: seller.velocityAccountStatus || "UNCONFIGURED",
        shiprocketPickupLocation: seller.shiprocketPickupLocation,
        courierPreference: seller.courierPreference || "BEST_AVAILABLE",
      },
      addonPrice: DELIVERY_ADDON_PRICE,
      isAddonActive,
      addonDetails: latestAddonDoc,
    });
  } catch (error) {
    console.error("[GET /delivery-addon/status error]", error);
    return res.status(500).json({ message: "Unable to fetch delivery add-on status" });
  }
});

// ─── POST /api/delivery-addon/create-payment ─────────────────────────────────
router.post("/create-payment", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Main subscription must be active to purchase Delivery Add-on
    if (seller.subscriptionStatus !== "ACTIVE" || !seller.subscriptionEndDate || seller.subscriptionEndDate <= new Date()) {
      return res.status(400).json({
        message: "Your main subscription must be active before enabling the Delivery Partner add-on.",
      });
    }

    // Check if add-on is already active and unexpired
    const now = new Date();
    if (
      seller.deliveryAddonStatus === "ACTIVE" &&
      seller.deliveryAddonExpiresAt &&
      seller.deliveryAddonExpiresAt > now
    ) {
      return res.status(400).json({
        message: "Delivery Partner add-on is already active for your store.",
      });
    }

    const amountPaise = DELIVERY_ADDON_PRICE * 100;
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock_id";
    let orderId = `mock_addon_order_${Date.now()}`;

    if (!isMock) {
      const options = {
        amount: amountPaise,
        currency: "INR",
        receipt: `receipt_addon_${seller._id}_${Date.now()}`,
        notes: {
          sellerId: seller._id.toString(),
          addonType: "DELIVERY_PARTNER",
        },
      };
      const order = await razorpay.orders.create(options);
      orderId = order.id;
    }

    // Create a PAYMENT_PENDING record
    const addonDoc = await DeliverySubscription.create({
      seller: seller._id,
      addonType: "DELIVERY_PARTNER",
      price: DELIVERY_ADDON_PRICE,
      currency: "INR",
      status: "PAYMENT_PENDING",
      orderId,
      mainSubscriptionEndDate: seller.subscriptionEndDate,
    });

    return res.json({
      orderId,
      amountPaise,
      currency: "INR",
      addonSubscriptionId: addonDoc._id,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_id",
      price: DELIVERY_ADDON_PRICE,
    });
  } catch (error) {
    console.error("[POST /delivery-addon/create-payment error]", error);
    return res.status(500).json({ message: "Unable to initiate ₹200 Delivery Add-on purchase" });
  }
});

// ─── POST /api/delivery-addon/verify-payment ─────────────────────────────────
router.post("/verify-payment", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addonSubscriptionId } = req.body;

    const addonDoc = await DeliverySubscription.findOne({
      _id: addonSubscriptionId,
      seller: req.sellerId,
    });

    if (!addonDoc) {
      return res.status(404).json({ message: "Delivery Add-on subscription record not found" });
    }

    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock_id";

    if (!isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        addonDoc.status = "PAYMENT_FAILED";
        await addonDoc.save();
        return res.status(400).json({ message: "Payment signature verification failed" });
      }
    }

    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const now = new Date();
    // Expiration date aligns strictly with seller's main subscription end date
    const expiresAt = seller.subscriptionEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update Add-on Record
    addonDoc.status = "ACTIVE";
    addonDoc.paymentId = razorpay_payment_id || `mock_payment_${Date.now()}`;
    addonDoc.razorpaySignature = razorpay_signature || "mock_signature";
    addonDoc.activatedAt = now;
    addonDoc.expiresAt = expiresAt;
    addonDoc.mainSubscriptionEndDate = seller.subscriptionEndDate;
    await addonDoc.save();

    // Update Seller Summary Record
    seller.deliveryAddonStatus = "ACTIVE";
    seller.deliveryAddonExpiresAt = expiresAt;
    await seller.save();

    return res.json({
      message: "Delivery Add-on activated successfully! Please confirm or update your pickup location.",
      deliverySubscription: addonDoc,
      seller: {
        deliveryAddonStatus: seller.deliveryAddonStatus,
        deliveryAddonExpiresAt: seller.deliveryAddonExpiresAt,
        shiprocketPickupLocation: seller.shiprocketPickupLocation || "",
      },
    });
  } catch (error) {
    console.error("[POST /delivery-addon/verify-payment error]", error);
    return res.status(500).json({ message: "Unable to verify payment and activate Delivery Add-on" });
  }
});

// ─── POST /api/delivery-addon/cancel ──────────────────────────────────────────
router.post("/cancel", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.deliveryAddonStatus = "CANCELLED";
    await seller.save();

    await DeliverySubscription.updateMany(
      { seller: seller._id, status: "ACTIVE" },
      { $set: { status: "CANCELLED" } }
    );

    return res.json({ message: "Delivery Add-on cancelled successfully. Active shipments remain trackable." });
  } catch (error) {
    console.error("[POST /delivery-addon/cancel error]", error);
    return res.status(500).json({ message: "Unable to cancel Delivery Add-on" });
  }
});

module.exports = router;
