const mongoose = require("mongoose");

const productReportSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    productTitle: {
      type: String,
      required: true,
      trim: true,
    },
    productCategory: {
      type: String,
      trim: true,
      default: "",
    },
    productImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    customOrderId: {
      type: String,
      default: "",
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    orderCreatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productReportSchema.index({ seller: 1, orderCreatedAt: -1 });
productReportSchema.index({ seller: 1, paymentStatus: 1, orderCreatedAt: -1 });
productReportSchema.index({ orderId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("ProductReport", productReportSchema);
