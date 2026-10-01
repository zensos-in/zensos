const mongoose = require("mongoose");
const { encrypt, decrypt, phoneHash, emailHash } = require("../utils/encryption");

const registrationLeadSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    emailHash: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    phoneHash: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

registrationLeadSchema.index({ emailHash: 1, phoneHash: 1 }, { unique: true });

registrationLeadSchema.pre("validate", function () {
  if (this.email && !this.emailHash) {
    this.emailHash = emailHash(this.email);
  }
  if (this.phone && !this.phoneHash) {
    this.phoneHash = phoneHash(this.phone);
  }
});

module.exports = mongoose.model("RegistrationLead", registrationLeadSchema);
