import { AppIcon } from "./ui/AppIcon";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

export function SubscriptionExpiredModal() {
  const { seller, logout } = useAuth();
  const { dismissExpiredPopup } = useSubscription();

  if (!seller) return null;
  if (seller.subscriptionStatus !== "EXPIRED") return null;
  if (seller.subscriptionExpiredPopupShown) return null;

  const handleLater = async () => {
    await dismissExpiredPopup();
  };

  const handleRenew = () => {
    // Dismiss the popup visually by scrolling to the subscription widget or 
    // simply closing the modal so they can interact with the dashboard widget
    void handleLater();
    const widget = document.getElementById("subscription-widget");
    if (widget) {
      widget.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="surface-card-strong w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 mb-4">
          <AppIcon name="inactive" className="text-[24px]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Subscription Expired
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
          Your subscription has expired. Your store has been temporarily disabled. Renew your subscription to continue selling.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
          <button
            onClick={handleRenew}
            className="w-full sm:w-auto rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95 text-center"
          >
            Renew Now
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleLater}
              className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 text-center"
            >
              Later
            </button>
            <button
              onClick={logout}
              className="w-full sm:w-auto rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-center"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
