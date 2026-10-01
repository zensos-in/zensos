const mongoose = require("mongoose");
const { encrypt, decrypt, phoneHash, emailHash } = require("../utils/encryption");

const parentOrderSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    customerPhoneHash: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    customerEmailHash: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    billingAddress: {
      type: String,
      trim: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    shippingAddress: {
      type: String,
      trim: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    shippingSameAsBilling: {
      type: Boolean,
      default: true,
    },
    shippingCustomerName: {
      type: String,
      trim: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    shippingCustomerPhone: {
      type: String,
      trim: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    totalAmountPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    subOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    orderConfirmationEmailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

parentOrderSchema.index({ createdAt: -1 });
parentOrderSchema.index({ customerPhoneHash: 1, customerEmailHash: 1 });

parentOrderSchema.pre("validate", function () {
  if (this.customerPhone && !this.customerPhoneHash) {
    this.customerPhoneHash = phoneHash(this.customerPhone);
  }
  if (this.customerEmail && !this.customerEmailHash) {
    this.customerEmailHash = emailHash(this.customerEmail);
  }
});

parentOrderSchema.pre("save", function (next) {
  if (this.isModified("customerPhone") || (!this.customerPhoneHash && this.customerPhone)) {
    this.customerPhoneHash = phoneHash(this.customerPhone);
  }
  if (this.isModified("customerEmail") || (!this.customerEmailHash && this.customerEmail)) {
    this.customerEmailHash = emailHash(this.customerEmail);
  }
  if (typeof next === "function") {
    next();
  }
});

module.exports = mongoose.model("ParentOrder", parentOrderSchema);
