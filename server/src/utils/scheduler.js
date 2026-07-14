const Seller = require("../models/Seller");

function startExpiryScheduler(intervalMs = 10 * 60 * 1000) {
  // Run once immediately on startup (after 5 seconds)
  setTimeout(runExpiryCheck, 5000);

  setInterval(runExpiryCheck, intervalMs);
}

async function runExpiryCheck() {
  try {
    const now = new Date();
    const result = await Seller.updateMany(
      {
        trialStatus: "active",
        trialEndsAt: { $lte: now }
      },
      {
        $set: {
          trialStatus: "expired"
        }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Expiry Scheduler] Successfully expired ${result.modifiedCount} stores.`);
    }
  } catch (error) {
    console.error("[Expiry Scheduler Error]", error);
  }
}

module.exports = { startExpiryScheduler };
