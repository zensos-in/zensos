import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppIcon } from "./ui/AppIcon";
import type { Shipment } from "../types";

interface ShipmentTrackingModalProps {
  orderId: string;
  onClose: () => void;
}

export function ShipmentTrackingModal({ orderId, onClose }: ShipmentTrackingModalProps) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<{ shipment: Shipment }>(`/shipping/track/${orderId}`)
      .then((res) => {
        setShipment(res.data.shipment);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load tracking information for this shipment.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 z-10">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <AppIcon name="shipping" className="text-2xl text-orange-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Shipment Tracking</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-slate-500">
            <AppIcon name="pending" className="mx-auto mb-2 text-2xl animate-spin text-orange-500" />
            Loading live shipment status...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        {!loading && shipment && (
          <div className="space-y-5">
            {/* Courier Summary Card */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 dark:border-orange-950/40 dark:bg-orange-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courier</span>
                <span className="rounded-full bg-orange-100 dark:bg-orange-900/50 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                  {shipment.courierName || "Standard Shipping"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-300">AWB Code:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{shipment.awbCode || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium mt-1">
                <span className="text-slate-600 dark:text-slate-300">Current Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{shipment.statusLabel || shipment.status}</span>
              </div>

              {shipment.trackingUrl && (
                <div className="mt-3 pt-3 border-t border-orange-200/60 dark:border-orange-900/40 text-right">
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    View Official Tracking Page →
                  </a>
                </div>
              )}
            </div>

            {/* Tracking Events Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Shipment Progress</h4>
              {shipment.trackingEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tracking updates recorded yet.</p>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {shipment.trackingEvents.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <span
                        className={`absolute -left-6 top-1.5 flex h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                          idx === 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {evt.activity || evt.status}
                      </p>
                      {evt.location && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{evt.location}</p>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(evt.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
