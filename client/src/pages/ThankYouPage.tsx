import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { ZensosLogo } from "../components/ZensosLogo";
import { AppIcon } from "../components/ui/AppIcon";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import type { OrderStatus } from "../types";

type PublicOrderStatus = {
  _id: string;
  paymentStatus: OrderStatus;
  paymentMethod?: "prepaid" | "cod";
};

const SUCCESS_STATUSES: OrderStatus[] = ["paid", "delivered"];
const POLL_INTERVAL_MS = 3000;

// "Seller Notified" and "Order being prepared" steps intentionally removed
const NEXT_STEPS: { icon: Parameters<typeof AppIcon>[0]["name"]; title: string; description: string; done: boolean }[] = [
  {
    icon: "check",
    title: "Order received",
    description: "We've received your order and payment.",
    done: true,
  },
  {
    icon: "truck",
    title: "Order on the way",
    description: "You'll receive updates on WhatsApp / SMS.",
    done: false,
  },
];

function formatOrderDate(date: Date) {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function ThankYouPage() {
  const { showError } = useToast();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<PublicOrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderDate] = useState(() => new Date());

  const sellerSlug = searchParams.get("sellerSlug") || "";
  const requestedPaymentMethod = searchParams.get("paymentMethod") || "";
  const orderIds = useMemo(
    () =>
      (searchParams.get("orderIds") || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [searchParams]
  );

  const fetchStatuses = useCallback(async () => {
    if (orderIds.length === 0) {
      setError("Missing payment reference. Please return to the store.");
      setLoading(false);
      return;
    }
    try {
      const response = await api.get<{ orders: PublicOrderStatus[] }>("/orders/public/status", {
        params: { ids: orderIds.join(","), sellerSlug: sellerSlug || undefined },
      });
      setOrders(response.data.orders);
      setError("");
    } catch {
      setError("Unable to verify payment status right now.");
    } finally {
      setLoading(false);
    }
  }, [orderIds, sellerSlug]);

  useEffect(() => { void fetchStatuses(); }, [fetchStatuses]);
  useEffect(() => { if (error) showError(error); }, [error, showError]);

  const allSuccessful =
    orders.length > 0 &&
    orders.length === orderIds.length &&
    orders.every((o) => SUCCESS_STATUSES.includes(o.paymentStatus));
  const isCodOrder =
    requestedPaymentMethod === "cod" ||
    (orders.length > 0 && orders.every((o) => o.paymentMethod === "cod"));
  const orderAccepted =
    isCodOrder &&
    orders.length > 0 &&
    orders.length === orderIds.length &&
    orders.every((o) => o.paymentStatus !== "cancelled");
  const anyCancelled = orders.some((o) => o.paymentStatus === "cancelled");
  const isSuccess = allSuccessful || orderAccepted;

  useEffect(() => {
    if (orderIds.length === 0 || allSuccessful || orderAccepted || anyCancelled) return;
    const poller = window.setInterval(() => { void fetchStatuses(); }, POLL_INTERVAL_MS);
    return () => window.clearInterval(poller);
  }, [allSuccessful, anyCancelled, fetchStatuses, orderAccepted, orderIds.length]);

  const storeName = sellerSlug
    ? sellerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <main className="min-h-screen w-full bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="relative mb-8 flex flex-col items-center text-center">
          {/* Confetti dots */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 overflow-hidden" aria-hidden>
            <span className="absolute left-[36%] top-1 h-2 w-2 rounded-full bg-amber-400 opacity-80" />
            <span className="absolute left-[22%] top-9 h-1.5 w-1.5 rounded-full bg-teal-400 opacity-70" />
            <span className="absolute left-[28%] top-16 h-2 w-2 rounded-full bg-pink-400 opacity-60" />
            <span className="absolute left-[18%] top-5 h-1 w-5 rotate-45 rounded-full bg-teal-500 opacity-40" />
            <span className="absolute left-[42%] top-0.5 h-1.5 w-1.5 rounded-full bg-purple-400 opacity-70" />
            <span className="absolute right-[36%] top-1 h-2 w-2 rounded-full bg-sky-400 opacity-80" />
            <span className="absolute right-[22%] top-9 h-1.5 w-1.5 rounded-full bg-orange-400 opacity-70" />
            <span className="absolute right-[28%] top-16 h-2 w-2 rounded-full bg-lime-400 opacity-60" />
            <span className="absolute right-[18%] top-5 h-1 w-5 -rotate-45 rounded-full bg-amber-400 opacity-40" />
            <span className="absolute right-[42%] top-0.5 h-1.5 w-1.5 rounded-full bg-teal-300 opacity-70" />
          </div>

          {/* Check circle */}
          <div className="relative z-10 mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#ff751f] to-[#ffc8a5] shadow-xl shadow-orange-500/30">
            <AppIcon name="check" className="text-[32px] text-white" />
          </div>

          <h1 className="font-heading text-[1.65rem] font-extrabold leading-tight text-slate-900 sm:text-3xl dark:text-white">
            {orderAccepted
              ? "Thank you, your order is confirmed!"
              : allSuccessful
                ? "Thank you for your payment!"
                : anyCancelled
                  ? "Payment cancelled"
                  : "Checking your payment…"}
          </h1>

          <p className="mt-2.5 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {orderAccepted
              ? "Your COD order has been placed."
              : allSuccessful
                ? "Your payment was successful."
                : anyCancelled
                  ? "This payment attempt looks cancelled. Go back to the store and try again."
                  : "If you just finished the UPI payment, keep this page open — it refreshes automatically."}
          </p>

          {/* Security pill */}
          {isSuccess && (
            <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-700 shadow-sm dark:border-orange-800/60 dark:bg-orange-950/60 dark:text-orange-300">
              <AppIcon name="policies" className="text-[17px]" />
              Your payment is secure and protected
            </div>
          )}
        </div>

        {/* ── Two-column card ──────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-slate-100 dark:sm:divide-slate-800">

            {/* Left — Order Details */}
            <div className="p-6 sm:p-7">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Order Details
              </p>
              <div className="space-y-5">
                {/* Order ID rows */}
                {orderIds.map((orderId) => {
                  const order = orders.find((item) => item._id === orderId);
                  const status = order?.paymentStatus || "pending";
                  return (
                    <div key={orderId} className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <AppIcon name="orders" className="text-[16px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">Order ID</p>
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{orderId}</p>
                        <span className="mt-0.5 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Date & Time */}
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <AppIcon name="pending" className="text-[16px]" />
                  </span>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Date &amp; Time</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {formatOrderDate(orderDate)}
                    </p>
                  </div>
                </div>

                {/* Store */}
                {storeName && (
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <AppIcon name="store" className="text-[16px]" />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Store</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{storeName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right — What Happens Next */}
            <div className="border-t border-slate-100 p-6 dark:border-slate-800 sm:border-t-0 sm:p-7">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                What happens next?
              </p>
              <div className="relative space-y-5 pl-[0.125rem]">
                {/* Vertical dashed connector */}
                <div
                  className="absolute left-[1.05rem] top-9 h-[calc(100%-2.5rem)] w-px border-l-2 border-dashed border-orange-100 dark:border-orange-900/60"
                  aria-hidden
                />

                {NEXT_STEPS.map((step, index) => (
                  <div key={index} className="relative flex items-start gap-3.5">
                    <span
                      className={`relative z-10 flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-xl border-2 ${step.done
                          ? "border-[#ff751f] bg-gradient-to-br from-[#ff751f] to-[#ffc8a5] text-white"
                          : "border-orange-200 bg-white text-orange-500 dark:border-orange-800/70 dark:bg-slate-900 dark:text-orange-400"
                        }`}
                    >
                      <AppIcon name={step.icon} className="text-[15px]" />
                    </span>
                    <div className="pt-0.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {sellerSlug && (
                <Link
                  to={`/store/${sellerSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <AppIcon name="store" className="text-[14px]" />
                  Back to Store
                </Link>
              )}
            </div>
            <Button
              type="button"
              onClick={() => void fetchStatuses()}
              loading={loading}
              variant="secondary"
              className="px-4 py-2.5"
            >
              <AppIcon name="refresh" className="text-[14px]" />
              Refresh Status
            </Button>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>Powered by</span>
          <ZensosLogo size="sm" alt="Zensos" />
        </footer>
      </div>
    </main>
  );
}
