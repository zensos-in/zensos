const mongoose = require("mongoose");
const { encrypt, decrypt, phoneHash, emailHash } = require("../utils/encryption");

const appointmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
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
      required: [true, "Phone number is required"],
      trim: true,
      set: encrypt,
      get: decrypt,
    },
    phoneHash: {
      type: String,
      trim: true,
      default: "",
    },
    preferredDate: {
      type: String,
      trim: true,
      default: "",
    },
    preferredTime: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: {
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

appointmentSchema.index({ createdAt: -1 });

appointmentSchema.pre("validate", function () {
  if (this.email && !this.emailHash) {
    this.emailHash = emailHash(this.email);
  }
  if (this.phone && !this.phoneHash) {
    this.phoneHash = phoneHash(this.phone);
  }
});

module.exports = mongoose.model("Appointment", appointmentSchema);
