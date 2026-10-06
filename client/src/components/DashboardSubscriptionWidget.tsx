import { AppIcon } from "./ui/AppIcon";
import { useAuth } from "../context/AuthContext";

export function DashboardSubscriptionWidget() {
  const { seller } = useAuth();

  if (!seller) return null;

  const now = new Date();
  const endDate = seller.subscriptionEndDate ? new Date(seller.subscriptionEndDate) : now;
  const diffTime = endDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const totalDays = seller.billingCycle === "QUARTERLY" ? 90 : seller.currentPlan === "TRIAL" ? 15 : 30;
  const progressPercent = Math.min(100, Math.max(0, 100 - (remainingDays / totalDays) * 100));

  const hasAddon = Boolean(
    seller.deliveryAddonStatus &&
    seller.deliveryAddonStatus !== "NOT_ACTIVE" &&
    (seller.deliveryAddonStatus === "ACTIVE" || seller.deliveryAddonExpiresAt)
  );

  const addonEndDate = seller.deliveryAddonExpiresAt ? new Date(seller.deliveryAddonExpiresAt) : null;
  const addonDiffTime = addonEndDate ? addonEndDate.getTime() - now.getTime() : 0;
  const addonRemainingDays = addonEndDate ? Math.max(0, Math.ceil(addonDiffTime / (1000 * 60 * 60 * 24))) : 0;
  const addonTotalDays = totalDays;
  const addonProgressPercent = addonEndDate
    ? Math.min(100, Math.max(0, 100 - (addonRemainingDays / (addonTotalDays || 30)) * 100))
    : 0;

  return (
    <div id="subscription-widget" className="surface-card-strong rounded-2xl p-5 mb-6 space-y-5">
      {/* ── Main Plan Subscription ── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AppIcon name="earnings" className="text-orange-500" />
            Subscriptions
          </h3>
          <div className="flex items-center gap-2">
            {seller.complimentaryOfferActive && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50">
                🎁 Complimentary Offer Active
              </span>
            )}
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${seller.subscriptionStatus === "ACTIVE"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
              {seller.subscriptionStatus}
            </span>
          </div>
        </div>

        {/* Plan info + progress bar — all in one line */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Plan</p>
            <p className="font-bold text-lg text-slate-900 dark:text-white capitalize flex items-center gap-1.5">
              <span>{seller.currentPlan?.toLowerCase() || "None"}</span>
              {seller.billingCycle === "QUARTERLY" && (
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Quarterly
                </span>
              )}
            </p>
          </div>
          <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Expires On</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {seller.subscriptionEndDate
                ? endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "N/A"}
            </p>
          </div>
          <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Remaining</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{remainingDays} Days</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${progressPercent > 80 ? "bg-red-500" : progressPercent > 50 ? "bg-orange-500" : "bg-emerald-500"
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1 text-slate-400">{Math.round(progressPercent)}% cycle used</p>
          </div>
        </div>
      </div>

      {/* ── Add-On Subscription Details (if purchased) ── */}
      {hasAddon && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📦</span>
                <span>Add-On Subscription</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Delivery Integration
              </span>
            </div>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
              seller.deliveryAddonStatus === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : seller.deliveryAddonStatus === "EXPIRED" || seller.deliveryAddonStatus === "CANCELLED"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {seller.deliveryAddonStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Add-On Feature</p>
              <p className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Delivery Partner Integration</span>
              </p>
            </div>
            <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Expires On</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {addonEndDate
                  ? addonEndDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  : "N/A"}
              </p>
            </div>
            <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Remaining</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {seller.deliveryAddonStatus === "ACTIVE" && addonRemainingDays > 0 ? `${addonRemainingDays} Days` : "0 Days"}
              </p>
            </div>
            {addonEndDate && (
              <div className="flex-1 min-w-0">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      addonProgressPercent > 80 ? "bg-red-500" : addonProgressPercent > 50 ? "bg-orange-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${addonProgressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-right mt-1 text-slate-400">{Math.round(addonProgressPercent)}% cycle used</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
