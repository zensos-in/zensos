/**
 * Calculates store access state based on subscription status and dates.
 */
function getStoreAccessState(seller) {
  const now = new Date();

  // If subscription fields are missing, assume legacy or not started
  if (!seller.subscriptionStatus || seller.subscriptionStatus === "NONE") {
    // Check old trialStatus for backward compatibility
    if (seller.trialStatus === "active") {
      const msPerDay = 24 * 60 * 60 * 1000;
      const difference = new Date(seller.trialEndsAt).getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(difference / msPerDay));
      return {
        hasAccess: true,
        status: "active",
        startedAt: seller.trialStartedAt,
        endsAt: seller.trialEndsAt,
        remainingDays,
      };
    }
    if (seller.trialStatus === "expired") {
       return {
        hasAccess: false,
        status: "expired",
        startedAt: seller.trialStartedAt,
        endsAt: seller.trialEndsAt,
        remainingDays: 0,
       };
    }

    return {
      hasAccess: true, // legacy stores default to true if completely undefined
      status: "legacy",
      startedAt: null,
      endsAt: null,
      remainingDays: null,
    };
  }

  if (seller.subscriptionStatus === "ACTIVE") {
    if (seller.subscriptionEndDate && now >= new Date(seller.subscriptionEndDate)) {
      return {
        hasAccess: false,
        status: "expired",
        startedAt: null, // We might not have this in seller model anymore, get from Subscription if needed, but trialService is simple
        endsAt: seller.subscriptionEndDate,
        remainingDays: 0,
      };
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const difference = new Date(seller.subscriptionEndDate).getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(difference / msPerDay));

    return {
      hasAccess: true,
      status: "active",
      startedAt: null,
      endsAt: seller.subscriptionEndDate,
      remainingDays,
    };
  }

  // EXPIRED, CANCELLED, PENDING
  return {
    hasAccess: false,
    status: seller.subscriptionStatus.toLowerCase(),
    startedAt: null,
    endsAt: seller.subscriptionEndDate,
    remainingDays: 0,
  };
}

module.exports = {
  getStoreAccessState,
};
