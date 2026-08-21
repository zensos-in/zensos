const mongoose = require("mongoose");

const deliverySubscriptionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    addonType: {
      type: String,
      default: "DELIVERY_PARTNER",
    },
    price: {
      type: Number,
      default: 200,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["NOT_ACTIVE", "PAYMENT_PENDING", "PAYMENT_FAILED", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"],
      default: "NOT_ACTIVE",
      index: true,
    },
    orderId: {
      type: String,
      default: "",
    },
    paymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    mainSubscriptionEndDate: {
      type: Date,
      default: null,
    },
    onboardingStatus: {
      type: String,
      enum: ["NOT_STARTED", "PENDING", "READY", "FAILED", "ACTION_REQUIRED"],
      default: "NOT_STARTED",
    },
    preferredCourier: {
      type: String,
      default: "BEST_AVAILABLE",
    },
    pickupLocationName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliverySubscription", deliverySubscriptionSchema);
