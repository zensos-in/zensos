import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import type { PlanType } from "../types";

const PLANS = [
  {
    label: "Starter",
    planKey: "STARTER" as PlanType,
    subtitle: "For sellers just getting started",
    price: "₹1,299",
    strikePrice: "₹999",
    color: "#6366f1",
    popular: false,
    cta: "Get Started",
    features: [
      "List up to 10 products",
      "Up to 2 store banners",
      "Printable PDF of order copy",
      "Payment Gateway Integration",
      "Settlement in T+2 days",
      "Free ZENSOS subdomain",
      "Real-time Store Analytics",
      "Email Support",
      "Trust Badge",
    ],
    comingSoon: [] as string[],
  },
  {
    label: "Growth",
    planKey: "GROWTH" as PlanType,
    subtitle: "For sellers ready to scale",
    price: "₹1,799",
    strikePrice: "₹1,499",
    color: "#ff751f",
    popular: true,
    cta: "Start Growing",
    features: [
      "List up to 20 products",
      "Up to 3 store banners",
      "Printable PDF of order copy",
      "Payment Gateway Integration",
      "Settlement in T+2 days",
      "Free ZENSOS subdomain",
      "Real-time Store Analytics",
      "Email and Call Support",
      "Trust Badge",
    ],
    comingSoon: [
      "Delivery Partner Integration",
      "Instagram Reels Integration",
      "Coupon Code Integration",
    ],
  },
  {
    label: "Business",
    planKey: "BUSINESS" as PlanType,
    subtitle: "For established sellers",
    price: "₹2,799",
    strikePrice: "₹2,499",
    color: "#10b981",
    popular: false,
    cta: "Go Business",
    features: [
      "List up to 30 products",
      "Up to 5 store banners",
      "Printable PDF of order copy",
      "Payment Gateway Integration",
      "Settlement in T+2 days",
      "Free ZENSOS subdomain",
      "Real-time Store Analytics",
      "Priority Support on Call",
      "Trust Badge",
    ],
    comingSoon: [
      "Delivery Partner Integration",
      "Instagram Reels Integration",
      "Coupon Code Integration",
      "Affiliate Program Integration",
      "Google Reviews Integration",
    ],
  },
];

interface PricingDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function PricingDrawer({ open, onClose }: PricingDrawerProps) {
  const { seller } = useAuth();
  const { purchaseSubscription, verifyPurchase, loading } = useSubscription();
  const [processing, setProcessing] = useState(false);


  if (!open || !seller) return null;

  const handlePurchase = async (planKey: PlanType) => {
    setProcessing(true);
    try {
      const purchaseRes = await purchaseSubscription(planKey);
      if (purchaseRes.orderId.startsWith("mock_order_")) {
        await verifyPurchase({
          razorpay_order_id: purchaseRes.orderId,
          razorpay_payment_id: "mock_payment_" + Date.now(),
          razorpay_signature: "mock_signature",
          subscriptionId: purchaseRes.subscriptionId,
        });
        alert(`Successfully subscribed to ${planKey}!`);
        onClose();
      } else {
        const options = {
          key: "rzp_test_mock_id",
          amount: purchaseRes.amountPaise,
          currency: purchaseRes.currency,
          name: "Zensos",
          description: `Subscription: ${planKey}`,
          order_id: purchaseRes.orderId,
          handler: async function (response: any) {
            try {
              await verifyPurchase({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subscriptionId: purchaseRes.subscriptionId,
              });
              alert(`Successfully subscribed to ${planKey}!`);
              onClose();
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
          theme: { color: "#ff4500" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
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
    <>
      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          style={{ animation: "fadeIn 0.3s ease forwards" }}
        />

        {/* Drawer — slides in from RIGHT, floats with margins */}
        <div
          className="absolute flex flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden"
          style={{
            width: "min(1200px, calc(100vw - 40px))",
            height: "700px",
            top: "max(20px, calc(50vh - 350px))",
            left: "max(20px, calc(50vw - 600px))",
            animation: "slideInFromRight 0.38s cubic-bezier(0.4,0,0.2,1) forwards",
          }}
        >
          {/* Drawer Header */}
          <div
            className="flex items-center justify-between px-7 py-5 shrink-0 border-b border-slate-100 dark:border-slate-800"
            style={{ background: "#fff7f0" }}
          >
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-2"
                style={{ background: "rgba(255,117,31,0.15)", color: "#ff751f" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff751f] animate-pulse inline-block" />
                Plans
              </span>
              <h2 className="text-2xl font-black" style={{ color: "#0b183f" }}>
                Simple, Transparent{" "}
                <span style={{ color: "#ff751f" }}>Pricing</span>
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                No hidden fees. No commission. Pay only for the plan that fits your business.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm border border-slate-200 shrink-0 ml-4"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable pricing cards */}
          <div
            className="flex-1 overflow-y-auto px-7 py-6"
            style={{ background: "#fff7f0" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.label}
                  className="relative rounded-3xl p-7 flex flex-col"
                  style={{
                    background: plan.popular
                      ? "linear-gradient(145deg,#0b183f,#0f2157)"
                      : "rgba(255,255,255,0.95)",
                    border: plan.popular
                      ? `2px solid ${plan.color}`
                      : "1px solid rgba(255,117,31,0.1)",
                    boxShadow: plan.popular
                      ? `0 20px 60px rgba(255,117,31,0.28)`
                      : "0 4px 16px rgba(0,0,0,0.06)",
                    animation: `slideInFromRight ${0.38 + i * 0.08}s cubic-bezier(0.4,0,0.2,1) forwards`,
                  }}
                >
                  {/* Recommended badge */}
                  {plan.popular && (
                    <div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-xs font-black text-white whitespace-nowrap"
                      style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}
                    >
                      ✦ RECOMMENDED
                    </div>
                  )}

                  {/* Plan name + subtitle */}
                  <p
                    className="text-base font-black uppercase tracking-widest mb-0.5"
                    style={{ color: plan.popular ? "#fff" : "#0b183f" }}
                  >
                    {plan.label}
                  </p>
                  <p
                    className="text-xs font-semibold mb-4"
                    style={{ color: plan.popular ? "rgba(255,255,255,0.5)" : "#94a3b8" }}
                  >
                    {plan.subtitle}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-4xl font-black" style={{ color: plan.popular ? "#fff" : "#0b183f" }}>
                      {plan.strikePrice}
                    </span>
                    <span
                      className="text-sm font-semibold line-through opacity-40"
                      style={{ color: plan.popular ? "#fff" : "#0b183f" }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: plan.popular ? "rgba(255,255,255,0.4)" : "#94a3b8" }}
                    >
                      + 18% GST /Monthly
                    </span>
                  </div>

                  {/* Handling charge */}
                  <p
                    className="text-xs font-semibold rounded-lg px-3 py-1.5 inline-block mb-4 w-fit"
                    style={{
                      background: plan.popular ? "rgba(255,117,31,0.18)" : "rgba(255,117,31,0.08)",
                      color: plan.popular ? "#ff9a5c" : "#ff751f",
                    }}
                  >
                    +3% per transaction (Payment Handling Charges)
                  </p>

                  {/* Features — always visible */}
                  <ul className="mb-4 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: plan.popular ? "rgba(255,255,255,0.8)" : "#475569" }}>
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: plan.color }}>✓</span>
                        {f}
                      </li>
                    ))}
                    {plan.comingSoon.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: plan.popular ? "rgba(255,255,255,0.8)" : "#475569" }}>
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: plan.color }}>✓</span>
                        {f}
                        <span className="text-xs font-bold" style={{ color: "#ff751f" }}>(Coming Soon)</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex-1" />

                  {/* CTA button */}
                  <button
                    onClick={() => handlePurchase(plan.planKey)}
                    disabled={processing || loading}
                    className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    style={
                      plan.popular
                        ? { background: "linear-gradient(135deg,#ff751f,#ff4500)", color: "#fff", boxShadow: "0 8px 20px rgba(255,117,31,0.4)" }
                        : { background: `${plan.color}18`, color: plan.color }
                    }
                  >
                    {processing ? "Processing..." : `${plan.cta} →`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-7 py-4 shrink-0 border-t border-orange-100"
            style={{ background: "#fff7f0" }}
          >
            <p className="text-xs text-center text-slate-400">
              Secure payments powered by Razorpay · All prices exclusive of GST
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
