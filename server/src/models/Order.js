const mongoose = require("mongoose");
const { encrypt, decrypt, phoneHash, emailHash } = require("../utils/encryption");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
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
    variantId: {
      type: String,
      trim: true,
      default: "",
    },
    variantTitle: {
      type: String,
      trim: true,
      default: "",
    },
    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentOrder",
      index: true,
      default: null,
    },
    customOrderId: {
      type: String,
      index: true,
      default: "",
    },
    razorpayOrderId: {
      type: String,
      index: true,
      default: "",
    },
    commissionAmountPaise: {
      type: Number,
      default: 0,
    },
    platformFeePercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    productAmountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryChargePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFeePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossAmountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    vendorAmountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    settlementStatus: {
      type: String,
      enum: ["unsettled", "pending", "processed", "failed", "reversed"],
      default: "unsettled",
      index: true,
    },
    settlementReferenceIds: {
      type: [String],
      default: [],
    },
    transferId: {
      type: String,
      default: "",
    },
    transferStatus: {
      type: String,
      enum: ["untransferred", "pending", "processed", "failed", "reversed"],
      default: "untransferred",
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
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
      trim: true,
      default: "",
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
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Selected variant values submitted by customer: { "Size": "M", "Color": "Red" }
    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },
    paymentMethod: {
      type: String,
      enum: ["prepaid", "cod"],
      default: "prepaid",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentScreenshotUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isViewed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Optimize order list sorting and report filtering
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ seller: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ seller: 1, customerPhoneHash: 1, customerEmailHash: 1 });

orderSchema.pre("validate", function () {
  if (this.customerPhone && !this.customerPhoneHash) {
    this.customerPhoneHash = phoneHash(this.customerPhone);
  }
  if (this.customerEmail && !this.customerEmailHash) {
    this.customerEmailHash = emailHash(this.customerEmail);
  }
});

orderSchema.pre("save", function (next) {
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

module.exports = mongoose.model("Order", orderSchema);
