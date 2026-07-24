import { AppIcon } from "./ui/AppIcon";
import { useAuth } from "../context/AuthContext";

export function SubscriptionReminderBanner() {
  const { seller } = useAuth();

  if (!seller || !seller.subscriptionEndDate || seller.subscriptionStatus === "EXPIRED") {
    return null;
  }

  const now = new Date();
  const endDate = new Date(seller.subscriptionEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 15) return null; // No reminder needed

  const isTrial = seller.currentPlan === "TRIAL";
  const planName = isTrial ? "free trial" : "subscription";

  let bgColor = "bg-blue-50 dark:bg-blue-900/20";
  let textColor = "text-blue-800 dark:text-blue-200";
  let iconColor = "text-blue-600 dark:text-blue-400";
  let iconName: "pending" | "lock" | "inactive" = "pending";
  let message = "";

  if (diffDays > 7 && diffDays <= 15) {
    message = `Your ${planName} ends in ${diffDays} days.`;
  } else if (diffDays > 2 && diffDays <= 7) {
    bgColor = "bg-orange-50 dark:bg-orange-900/20";
    textColor = "text-orange-800 dark:text-orange-200";
    iconColor = "text-orange-600 dark:text-orange-400";
    iconName = "lock";
    message = `Your ${planName} expires soon. Upgrade to avoid store interruption.`;
  } else if (diffDays > 0 && diffDays <= 2) {
    bgColor = "bg-red-50 dark:bg-red-900/20";
    textColor = "text-red-800 dark:text-red-200";
    iconColor = "text-red-600 dark:text-red-400";
    iconName = "inactive";
    message = `Your ${planName} expires ${diffDays === 1 ? "tomorrow" : "in 2 days"}. Purchase a subscription now.`;
  } else if (diffDays === 0) {
    bgColor = "bg-red-100 dark:bg-red-900/40";
    textColor = "text-red-900 dark:text-red-100";
    iconColor = "text-red-700 dark:text-red-400";
    iconName = "inactive";
    message = isTrial ? "Trial expires today." : "Subscription expires today.";
  } else {
    // If negative somehow, we don't show the banner (expired modal should handle it)
    return null;
  }

  return (
    <div className={`w-full px-4 py-3 flex items-center justify-between ${bgColor}`}>
      <div className="flex items-center gap-3">
        <AppIcon name={iconName} className={iconColor} />
        <p className={`text-sm font-semibold ${textColor}`}>{message}</p>
      </div>
      <button 
        onClick={() => {
          const widget = document.getElementById("subscription-widget");
          if (widget) {
            widget.scrollIntoView({ behavior: "smooth" });
          }
        }}
        className={`text-xs font-bold px-3 py-1.5 rounded-lg border border-transparent transition-colors shadow-sm
          ${diffDays <= 7 
            ? "bg-white text-slate-900 hover:bg-slate-50" 
            : "bg-blue-600 text-white hover:bg-blue-700"}`}
      >
        Renew
      </button>
    </div>
  );
}
