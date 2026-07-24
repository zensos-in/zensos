import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { ZensosLogo } from "../components/ZensosLogo";
import { AppIcon } from "../components/ui/AppIcon";
import type { OrderStatus, PaymentMethod } from "../types";

type CustomerOrderItem = {
  productTitle: string;
  productImageUrl?: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CustomerOrder = {
  _id: string;
  paymentStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  deliveryCharge: number;
  quantity: number;
  customerName: string;
  createdAt: string;
  items: CustomerOrderItem[];
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
  paid: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60",
  delivered:
    "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800/60",
  cancelled:
    "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60",
};

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function CustomerOrdersPage() {
  const [searchParams] = useSearchParams();
  const sellerSlug = searchParams.get("sellerSlug") || "";
  const customerPhone = searchParams.get("customerPhone") || "";

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!sellerSlug || !customerPhone) {
      setError("Missing store or customer information.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get<{ orders: CustomerOrder[] }>(
        "/orders/public/by-customer",
        { params: { sellerSlug, customerPhone } }
      );
      setOrders(response.data.orders);
      setError("");
    } catch {
      setError("Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sellerSlug, customerPhone]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const storeHref = sellerSlug ? `/store/${sellerSlug}` : "/";

  return (
    <main className="min-h-screen w-full bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-[#ff751f] shadow-xl shadow-orange-500/30">
            <AppIcon name="orders" className="text-[28px] text-white" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Your Orders
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            All past orders you have placed at this store
          </p>
        </div>

        {/* ── Loading ───────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <span className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <AppIcon name="refresh" className="text-[20px]" />
            </span>
            <p className="text-sm text-slate-400">Loading your orders…</p>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-center text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* ── Empty ─────────────────────────────────────────────── */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <AppIcon name="orders" className="text-[26px]" />
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">No orders yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You haven't placed any orders at this store.
            </p>
          </div>
        )}

        {/* ── Orders list ───────────────────────────────────────── */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const total = order.amount + (order.deliveryCharge || 0);
              const displayItems =
                Array.isArray(order.items) && order.items.length > 0
                  ? order.items
                  : [];

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Card header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Order ID
                      </p>
                      <p className="mt-0.5 truncate font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                        {order.customOrderId || order._id}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold capitalize ${STATUS_COLORS[order.paymentStatus]}`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  {displayItems.length > 0 && (
                    <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
                      {displayItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-3">
                          {item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt={item.productTitle}
                              className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-cover dark:border-slate-700 dark:bg-slate-800"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                              <AppIcon name="orders" className="text-[15px]" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {item.productTitle}
                            </p>
                            {item.variantTitle && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {item.variantTitle}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {formatCurrency(item.lineTotal)}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
                    {order.deliveryCharge > 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Delivery: {formatCurrency(order.deliveryCharge)}
                      </p>
                    ) : (
                      <p className="text-xs text-teal-600 dark:text-teal-400">Free delivery</p>
                    )}
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Total: {formatCurrency(total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Back to Store ─────────────────────────────────────── */}
        <div className="mt-10 flex justify-center">
          <Link
            to={storeHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:scale-105 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <AppIcon name="store" className="text-[15px]" />
            Back to Store
          </Link>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>Powered by</span>
          <ZensosLogo size="sm" alt="Zensos" />
        </footer>
      </div>
    </main>
  );
}
