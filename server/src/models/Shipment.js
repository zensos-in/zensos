const mongoose = require("mongoose");

const trackingEventSchema = new mongoose.Schema(
  {
    status: { type: String, trim: true },
    activity: { type: String, trim: true },
    location: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentOrder",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: "SHIPROCKET",
    },
    shiprocketOrderId: {
      type: Number,
      default: null,
    },
    shiprocketShipmentId: {
      type: Number,
      default: null,
    },
    awbCode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    courierCompanyId: {
      type: Number,
      default: null,
    },
    courierName: {
      type: String,
      trim: true,
      default: "",
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "PICKUP_SCHEDULED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RTO",
        "RETURN",
      ],
      default: "CREATED",
      index: true,
    },
    statusLabel: {
      type: String,
      trim: true,
      default: "Order Created",
    },
    trackingUrl: {
      type: String,
      trim: true,
      default: "",
    },
    freightCharge: {
      type: Number,
      default: 0,
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    trackingEvents: {
      type: [trackingEventSchema],
      default: [],
    },
    labelUrl: {
      type: String,
      trim: true,
      default: "",
    },
    manifestUrl: {
      type: String,
      trim: true,
      default: "",
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
