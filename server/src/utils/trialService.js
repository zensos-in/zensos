/**
 * Calculates store access state based on trial status and dates.
 * Supporting legacy stores with undefined trial fields by granting them default access.
 */
function getStoreAccessState(seller) {
  const now = new Date();

  // If trialStatus is undefined/null, treat as a legacy store (permanent access)
  if (seller.trialStatus === undefined || seller.trialStatus === null) {
    return {
      hasAccess: true,
      status: "legacy",
      startedAt: null,
      endsAt: null,
      remainingDays: null,
    };
  }

  if (seller.trialStatus === "not_started") {
    return {
      hasAccess: false,
      status: "not_started",
      startedAt: null,
      endsAt: null,
      remainingDays: null,
    };
  }

  if (seller.trialStatus === "active") {
    if (seller.trialEndsAt && now >= new Date(seller.trialEndsAt)) {
      return {
        hasAccess: false,
        status: "expired",
        startedAt: seller.trialStartedAt,
        endsAt: seller.trialEndsAt,
        remainingDays: 0,
      };
    }

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

  // trialStatus === "expired"
  return {
    hasAccess: false,
    status: "expired",
    startedAt: seller.trialStartedAt,
    endsAt: seller.trialEndsAt,
    remainingDays: 0,
  };
}

module.exports = {
  getStoreAccessState,
};
