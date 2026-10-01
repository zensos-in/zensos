const mongoose = require("mongoose");
const { encrypt, decrypt, phoneHash, emailHash } = require("../utils/encryption");

const customerOtpSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    customerPhone: {
      type: String,
      required: true,
      set: encrypt,
      get: decrypt,
    },
    customerPhoneHash: {
      type: String,
      required: true,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      set: encrypt,
      get: decrypt,
    },
    customerEmailHash: {
      type: String,
      required: true,
      index: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB will auto-delete the document when expiresAt is reached
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

customerOtpSchema.index({ sellerId: 1, customerPhoneHash: 1, customerEmailHash: 1 });

customerOtpSchema.pre("validate", function () {
  if (this.customerPhone && !this.customerPhoneHash) {
    this.customerPhoneHash = phoneHash(this.customerPhone);
  }
  if (this.customerEmail && !this.customerEmailHash) {
    this.customerEmailHash = emailHash(this.customerEmail);
  }
});

module.exports = mongoose.model("CustomerOtp", customerOtpSchema);
