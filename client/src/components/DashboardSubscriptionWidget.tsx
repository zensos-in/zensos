import { AppIcon } from "./ui/AppIcon";
import { useAuth } from "../context/AuthContext";

export function DashboardSubscriptionWidget() {
  const { seller } = useAuth();

  if (!seller) return null;

  const now = new Date();
  const endDate = seller.subscriptionEndDate ? new Date(seller.subscriptionEndDate) : now;
  const diffTime = endDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const totalDays = seller.currentPlan === "TRIAL" ? 15 : 30;
  const progressPercent = Math.min(100, Math.max(0, 100 - (remainingDays / totalDays) * 100));

  return (
    <div id="subscription-widget" className="surface-card-strong rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AppIcon name="earnings" className="text-orange-500" />
          Subscriptions
        </h3>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${seller.subscriptionStatus === "ACTIVE"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
          {seller.subscriptionStatus}
        </span>
      </div>

      {/* Plan info + progress bar — all in one line */}
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Plan</p>
          <p className="font-bold text-lg text-slate-900 dark:text-white capitalize">
            {seller.currentPlan?.toLowerCase() || "None"}
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
  );
}
