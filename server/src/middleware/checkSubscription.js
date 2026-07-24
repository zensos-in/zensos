const Seller = require("../models/Seller");

/**
 * Middleware to check if the seller's subscription is active.
 * Should be used after `auth` middleware so `req.sellerId` is available.
 */
async function checkSubscription(req, res, next) {
  try {
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Daily Subscription Validation
    const now = new Date();
    let isExpired = false;

    if (seller.subscriptionStatus === "ACTIVE" && seller.subscriptionEndDate) {
      if (now > seller.subscriptionEndDate) {
        seller.subscriptionStatus = "EXPIRED";
        seller.storeEnabled = false;
        seller.currentPlan = "NONE";
        seller.subscriptionExpiredPopupShown = false; // Reset so they see it again
        await seller.save();
        isExpired = true;
      }
    } else if (seller.subscriptionStatus === "EXPIRED" || seller.subscriptionStatus === "NONE") {
      isExpired = true;
    }

    if (isExpired) {
      return res.status(403).json({
        message: "Subscription expired. Please renew your subscription.",
        subscriptionExpired: true
      });
    }

    // Attach seller to request for downstream usage (e.g. plan restrictions)
    req.seller = seller;
    next();
  } catch (error) {
    console.error("[checkSubscription error]", error);
    return res.status(500).json({ message: "Unable to verify subscription" });
  }
}

module.exports = checkSubscription;
