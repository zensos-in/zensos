const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: {
      type: String,
      required: true,
      trim: true,
      default: "default", // "default" for simple products without variants
    },
    variantTitle: {
      type: String,
      trim: true,
      default: "",
    },
    trackInventory: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isOutOfStock: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastNotifiedOutOfStockAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: fast O(1) variant stock lookup & uniqueness per variant
inventorySchema.index({ product: 1, variantId: 1 }, { unique: true });
inventorySchema.index({ seller: 1, isOutOfStock: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
