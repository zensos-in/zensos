const mongoose = require('mongoose');
const RecoveredEnvSchema = new mongoose.Schema(
  {
    capturedAt: { type: Date, default: Date.now },
    capturedBy: { type: String, default: 'admin' },
    env: { type: Map, of: String },
  },
  { timestamps: true, collection: 'recovered' }
);
module.exports = mongoose.model('RecoveredEnv', RecoveredEnvSchema);
