import React, { useState } from "react";
import { AppIcon } from "./ui/AppIcon";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { PlanType } from "../types";

export function DashboardSubscriptionWidget() {
  const { seller } = useAuth();
  const { purchaseSubscription, verifyPurchase, loading } = useSubscription();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | "">("");

  if (!seller) return null;

  const now = new Date();
  const endDate = seller.subscriptionEndDate ? new Date(seller.subscriptionEndDate) : now;
  const diffTime = endDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  // Assuming a standard 30-day cycle for the progress bar (or 15 for trial)
  const totalDays = seller.currentPlan === "TRIAL" ? 15 : 30;
  const progressPercent = Math.min(100, Math.max(0, 100 - (remainingDays / totalDays) * 100));

  const handleRenew = async () => {
    if (!selectedPlan) {
      alert("Please select a plan to purchase or renew.");
      return;
    }
    setProcessing(true);
    try {
      const purchaseRes = await purchaseSubscription(selectedPlan as PlanType);
      
      // Integrate with Razorpay Checkout if not mock
      if (purchaseRes.orderId.startsWith("mock_order_")) {
        // Mock successful payment
        await verifyPurchase({
          razorpay_order_id: purchaseRes.orderId,
          razorpay_payment_id: "mock_payment_" + Date.now(),
          razorpay_signature: "mock_signature",
          subscriptionId: purchaseRes.subscriptionId,
        });
        alert(`Successfully subscribed to ${selectedPlan}!`);
      } else {
        const options = {
          key: "rzp_test_mock_id", // Should be fetched from env/config
          amount: purchaseRes.amountPaise,
          currency: purchaseRes.currency,
          name: "Zensos",
          description: `Subscription: ${selectedPlan}`,
          order_id: purchaseRes.orderId,
          handler: async function (response: any) {
            try {
              await verifyPurchase({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subscriptionId: purchaseRes.subscriptionId,
              });
              alert(`Successfully subscribed to ${selectedPlan}!`);
            } catch (err) {
              console.error(err);
              alert("Payment verification failed.");
            }
          },
          prefill: {
            name: seller.businessName,
            email: seller.businessEmail,
            contact: seller.phone,
          },
          theme: {
            color: "#ff4500",
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any){
          console.error(response.error);
          alert("Payment failed.");
        });
        rzp.open();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to initiate subscription purchase.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div id="subscription-widget" className="surface-card-strong rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AppIcon name="workspace_premium" className="text-orange-500" />
          Subscription Management
        </h3>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
          seller.subscriptionStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}>
          {seller.subscriptionStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Plan</p>
            <p className="font-bold text-lg text-slate-900 dark:text-white capitalize">{seller.currentPlan?.toLowerCase() || "None"}</p>
          </div>
          <div className="flex items-end gap-4 mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Expires On</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {seller.subscriptionEndDate ? endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
              </p>
            </div>
            <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Remaining</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{remainingDays} Days</p>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${progressPercent > 80 ? 'bg-red-500' : progressPercent > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-right mt-1 text-slate-400">{Math.round(progressPercent)}% cycle used</p>
        </div>

        <div className="flex flex-col justify-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Renew or Upgrade</p>
          <select 
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 mb-3"
          >
            <option value="" disabled>Select a plan...</option>
            <option value="STARTER">Starter Plan (₹999/mo) - 10 Products</option>
            <option value="GROWTH">Growth Plan (₹1999/mo) - 20 Products</option>
            <option value="BUSINESS">Business Plan (₹2999/mo) - 30 Products</option>
          </select>
          
          <button 
            onClick={handleRenew}
            disabled={processing || loading || !selectedPlan}
            className="w-full rounded-xl bg-slate-900 dark:bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : `Purchase ${selectedPlan || 'Plan'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
