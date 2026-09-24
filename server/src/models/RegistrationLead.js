const mongoose = require("mongoose");

const registrationLeadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

registrationLeadSchema.index({ email: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("RegistrationLead", registrationLeadSchema);
