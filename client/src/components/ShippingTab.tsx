import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AppIcon } from "./ui/AppIcon";
import { ShipmentTrackingModal } from "./ShipmentTrackingModal";
import type { Shipment, CourierPreference, Order, OrderStatus } from "../types";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const COURIER_OPTIONS: { label: string; value: CourierPreference }[] = [
  { label: "Best Available (Recommended)", value: "BEST_AVAILABLE" },
  { label: "Lowest Cost", value: "LOWEST_COST" },
  { label: "Fastest Delivery", value: "FASTEST" },
  { label: "Blue Dart", value: "BLUEDART" },
  { label: "DTDC", value: "DTDC" },
  { label: "Delhivery", value: "DELHIVERY" },
  { label: "Ekart", value: "EKART" },
  { label: "Xpressbees", value: "XPRESSBEES" },
];

const LOGISTICS_PROVIDERS = [
  { id: "SHIPROCKET", name: "Shiprocket", description: "All-in-one multi-courier shipping (Bluedart, Delhivery, DTDC, Ekart, etc.)" },
  { id: "CLICKPOST", name: "ClickPost AI", description: "AI-driven multi-carrier logistics routing & tracking (500+ couriers)" },
  { id: "NIMBUSPOST", name: "NimbusPost", description: "Advanced ecommerce multi-carrier shipping automation" },
  { id: "VELOCITY", name: "Velocity", description: "High-speed logistics and warehousing delivery" },
  { id: "SELF_MANUAL", name: "Self / Manual Delivery", description: "Direct local delivery or self-managed courier dispatch" },
];

const SELF_SHIPPING_OPTIONS = [
  "Self Hand Delivery",
  "Local Delivery Boy / Agent",
  "Direct Store Pickup / Counter",
  "India Post / Speed Post",
  "Custom Courier / Transport",
  "Direct Dispatch",
];

const SELF_SHIPPING_STORAGE_KEY = "zensos_self_shipping_methods";

type ShippingTabProps = {
  orders?: Order[];
  onOrderStatusChange?: (orderId: string, status: OrderStatus) => Promise<void>;
  onRefreshOrders?: () => Promise<void>;
  onViewOrder?: (order: Order) => void;
};

export function ShippingTab({
  orders: propOrders,
  onOrderStatusChange,
  onRefreshOrders,
  onViewOrder,
}: ShippingTabProps) {
  const { seller, refreshProfile } = useAuth();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [isAddonActive, setIsAddonActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [courierPreference, setCourierPreference] = useState<string>("BEST_AVAILABLE");

  // Provider Settings
  const [selectedProvider, setSelectedProvider] = useState<string>("SHIPROCKET");
  const [providerEmail, setProviderEmail] = useState<string>("");
  const [providerPassword, setProviderPassword] = useState<string>("");
  const [clickpostApiKey, setClickpostApiKey] = useState<string>("");
  const [clickpostUsername, setClickpostUsername] = useState<string>("");
  const [savingProvider, setSavingProvider] = useState(false);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [settingUpPickup, setSettingUpPickup] = useState(false);
  const [updatingPref, setUpdatingPref] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [assigningAwbId, setAssigningAwbId] = useState<string | null>(null);
  const [cancellingShipment, setCancellingShipment] = useState<Shipment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("Customer requested cancellation / address change");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Self Delivery State
  const [selfOrderSearch, setSelfOrderSearch] = useState("");
  const [selfStatusFilter, setSelfStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selfShippingMethods, setSelfShippingMethods] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(SELF_SHIPPING_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const activeOrders = useMemo(() => {
    return propOrders && propOrders.length > 0 ? propOrders : internalOrders;
  }, [propOrders, internalOrders]);

  function handleSetShippingMethod(orderId: string, method: string) {
    setSelfShippingMethods((prev) => {
      const updated = { ...prev, [orderId]: method };
      try {
        localStorage.setItem(SELF_SHIPPING_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage write errors
      }
      return updated;
    });
    showSuccess(`Shipping method saved as "${method}"`);
  }

  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
    setUpdatingOrderId(orderId);
    try {
      if (onOrderStatusChange) {
        await onOrderStatusChange(orderId, newStatus);
      } else {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      }

      setInternalOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: newStatus } : o))
      );

      if (onRefreshOrders) {
        await onRefreshOrders();
      }

      showSuccess(`Order status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Could not update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleAssignAwb(shipmentId: string) {
    setAssigningAwbId(shipmentId);
    try {
      const res = await api.post(`/shipping/shipments/${shipmentId}/assign-awb`, {});
      showSuccess(res.data?.message || "AWB assigned successfully!");
      await fetchStatus();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not assign AWB. Please verify your Shiprocket wallet balance or courier availability.";
      showError(msg);
    } finally {
      setAssigningAwbId(null);
    }
  }

  async function handleConfirmCancelShipment() {
    if (!cancellingShipment) return;
    setIsCancelling(true);
    try {
      const finalReason = cancelReason === "Other" ? customCancelReason : cancelReason;
      const res = await api.post(`/shipping/shipments/${cancellingShipment._id}/cancel`, {
        reason: finalReason || "Cancelled by seller",
      });
      showSuccess(res.data?.message || "Shipment cancelled successfully!");
      setCancellingShipment(null);
      setCancelReason("Customer requested cancellation / address change");
      setCustomCancelReason("");
      await fetchStatus();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Could not cancel shipment.");
    } finally {
      setIsCancelling(false);
    }
  }

  // Pickup location configuration form state
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [pickupForm, setPickupForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });

  function prefillFromSeller() {
    const rawAddress = seller?.businessAddress || "";
    const pincodeMatch = rawAddress.match(/\b(\d{6})\b/);
    const parts = rawAddress.split(/[,\n]+/).map((p: string) => p.trim()).filter(Boolean);

    setPickupForm({
      name: seller?.businessName || "",
      email: seller?.businessEmail || "",
      phone: seller?.phone || "",
      address: parts[0] || rawAddress || "",
      address2: parts[1] || "",
      city: parts.find((p: string) => !/\d{6}/.test(p) && p !== parts[0]) || "",
      state: parts.slice(2).find((p: string) => !/\d{6}/.test(p)) || "",
      pincode: pincodeMatch ? pincodeMatch[1] : "",
    });
  }

  async function fetchStatus() {
    setLoading(true);
    try {
      const [resStatus, resShipments, resOrders] = await Promise.all([
        api.get<{
          isAddonActive: boolean;
          seller: {
            deliveryAddonStatus: string;
            deliveryAddonExpiresAt: string | null;
            preferredLogisticsProvider?: string;
            shiprocketEmail?: string;
            nimbuspostEmail?: string;
            velocityEmail?: string;
            clickpostApiKey?: string;
            clickpostUsername?: string;
            shiprocketPickupLocation: string;
            courierPreference: string;
          };
        }>("/delivery-addon/status"),
        api.get<{ shipments: Shipment[] }>("/shipping/shipments").catch(() => ({ data: { shipments: [] } })),
        api.get<{ orders: Order[] }>("/orders/my").catch(() => ({ data: { orders: [] } })),
      ]);

      const active = Boolean(resStatus.data.isAddonActive);
      setIsAddonActive(active);
      setExpiryDate(resStatus.data.seller.deliveryAddonExpiresAt);
      const loc = resStatus.data.seller.shiprocketPickupLocation || "";
      setPickupLocation(loc);
      setCourierPreference(resStatus.data.seller.courierPreference || "BEST_AVAILABLE");
      const provider = resStatus.data.seller.preferredLogisticsProvider || "SHIPROCKET";
      setSelectedProvider(provider);
      setClickpostApiKey(resStatus.data.seller.clickpostApiKey || "");
      setClickpostUsername(resStatus.data.seller.clickpostUsername || "");
      setProviderEmail(
        provider === "NIMBUSPOST"
          ? resStatus.data.seller.nimbuspostEmail || ""
          : provider === "VELOCITY"
          ? resStatus.data.seller.velocityEmail || ""
          : resStatus.data.seller.shiprocketEmail || ""
      );
      setShipments(resShipments.data.shipments || []);
      setInternalOrders(resOrders.data.orders || []);

      if (active && !loc && provider !== "SELF_MANUAL") {
        setShowPickupForm(true);
        prefillFromSeller();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (seller && !pickupForm.name) {
      prefillFromSeller();
    }
  }, [seller]);

  async function handlePurchaseAddon() {
    setPurchasing(true);
    try {
      const resOrder = await api.post<{
        orderId: string;
        amountPaise: number;
        currency: string;
        addonSubscriptionId: string;
        keyId: string;
      }>("/delivery-addon/create-payment");

      const { orderId, amountPaise, currency, addonSubscriptionId, keyId } = resOrder.data;

      if (orderId.startsWith("mock_addon_order_")) {
        await api.post("/delivery-addon/verify-payment", {
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_addon_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          addonSubscriptionId,
        });

        showSuccess("Shipping Add-on activated!");
        await refreshProfile();
        fetchStatus();
        if (selectedProvider !== "SELF_MANUAL") {
          setShowPickupForm(true);
          prefillFromSeller();
        }
        setPurchasing(false);
      } else {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showError("Failed to load Razorpay payment gateway.");
          setPurchasing(false);
          return;
        }

        const options = {
          key: keyId,
          amount: amountPaise,
          currency: currency || "INR",
          name: "Zensos",
          description: "Delivery Partner Add-on (₹200 + 18% GST)",
          order_id: orderId,
          handler: async function (response: any) {
            try {
              await api.post("/delivery-addon/verify-payment", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                addonSubscriptionId,
              });
              showSuccess("Shipping Add-on activated!");
              await refreshProfile();
              fetchStatus();
              if (selectedProvider !== "SELF_MANUAL") {
                setShowPickupForm(true);
                prefillFromSeller();
              }
            } catch (err: any) {
              console.error(err);
              showError("Payment verification failed.");
            } finally {
              setPurchasing(false);
            }
          },
          prefill: {
            name: seller?.businessName || "",
            email: seller?.businessEmail || "",
            contact: seller?.phone || "",
          },
          theme: { color: "#ff751f" },
          modal: {
            ondismiss: function () {
              setPurchasing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          showError("Payment failed: " + (response.error?.description || "Transaction failed"));
          setPurchasing(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      showError(err?.response?.data?.message || "Could not initiate payment.");
      setPurchasing(false);
    }
  }

  async function handleConfirmPickup(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!pickupForm.address.trim() || !pickupForm.pincode.trim()) {
      showError("Pickup address and pincode are required.");
      return;
    }

    setSettingUpPickup(true);
    try {
      const res = await api.post<{ pickupLocation: string }>("/shipping/onboarding/setup", pickupForm);
      setPickupLocation(res.data.pickupLocation);
      setShowPickupForm(false);
      showSuccess("Pickup location registered successfully!");
      await refreshProfile();
      fetchStatus();
    } catch (err: any) {
      console.error(err);
      showError(err?.response?.data?.message || err?.response?.data?.error || "Pickup configuration failed.");
    } finally {
      setSettingUpPickup(false);
    }
  }

  async function handleSavePreference(newPref: string) {
    setUpdatingPref(true);
    setCourierPreference(newPref);
    try {
      await api.put("/shipping/preferences", { courierPreference: newPref });
      showSuccess("Courier preference saved!");
    } catch (err: any) {
      console.error(err);
      showError("Could not update courier preference.");
    } finally {
      setUpdatingPref(false);
    }
  }

  async function handleSaveProvider(e: React.FormEvent) {
    e.preventDefault();
    setSavingProvider(true);
    try {
      await api.put("/shipping/provider", {
        provider: selectedProvider,
        email: providerEmail,
        password: providerPassword,
        clickpostApiKey,
        clickpostUsername,
        apiKey: clickpostApiKey,
        username: clickpostUsername,
      });
      showSuccess(`Saved logistics provider as ${selectedProvider}`);
      setProviderPassword("");
      await refreshProfile();
      fetchStatus();
    } catch (err: any) {
      console.error(err);
      showError(err?.response?.data?.message || "Could not update logistics provider.");
    } finally {
      setSavingProvider(false);
    }
  }

  // Filtered orders for Self / Manual delivery view
  const filteredSelfOrders = useMemo(() => {
    return activeOrders.filter((o) => {
      if (selfStatusFilter !== "all" && o.paymentStatus !== selfStatusFilter) {
        return false;
      }
      if (!selfOrderSearch.trim()) return true;

      const q = selfOrderSearch.trim().toLowerCase();
      const orderId = (o.customOrderId || o._id || "").toLowerCase();
      const customer = (o.customerName || "").toLowerCase();
      const phone = (o.customerPhone || "").toLowerCase();
      const addr = (o.deliveryAddress || "").toLowerCase();
      const items = (o.items || [])
        .map((i) => i.productTitle || "")
        .join(" ")
        .toLowerCase();

      return (
        orderId.includes(q) ||
        customer.includes(q) ||
        phone.includes(q) ||
        addr.includes(q) ||
        items.includes(q)
      );
    });
  }, [activeOrders, selfStatusFilter, selfOrderSearch]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        <AppIcon name="pending" className="mr-2 animate-spin text-xl text-orange-500" />
        Loading Shipping configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-orange-50/50 p-6 dark:border-orange-950/40 dark:from-orange-950/20 dark:via-slate-900 dark:to-orange-950/10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AppIcon name="shipping" className="text-2xl text-orange-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Shipping & Delivery Partner</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automate courier shipping, print labels, or manage self-dispatch delivery directly for your customer orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAddonActive ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Shipping Feature ACTIVE
                </span>
                {expiryDate && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Expires: {new Date(expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePurchaseAddon}
                disabled={purchasing}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
              >
                <AppIcon name="shipping" className="text-sm" />
                {purchasing ? "Opening Payment..." : "Activate Delivery Add-on (₹200 + 18% GST)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logistics Provider Selection */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AppIcon name="truck" className="text-orange-500" />
              Logistics Delivery Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your fulfillment model — automated courier networks (Shiprocket, ClickPost) or direct Self / Manual delivery.
            </p>
          </div>
          <span className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/50 dark:border-orange-900/50 dark:text-orange-400">
            Active: {LOGISTICS_PROVIDERS.find((p) => p.id === selectedProvider)?.name || selectedProvider}
          </span>
        </div>

        <form onSubmit={handleSaveProvider} className="space-y-4">
          {/* Provider Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {LOGISTICS_PROVIDERS.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  selectedProvider === p.id
                    ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</span>
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedProvider === p.id ? "border-orange-500 bg-orange-500" : "border-slate-300"
                    }`}
                  >
                    {selectedProvider === p.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{p.description}</p>
              </div>
            ))}
          </div>

          {/* Credential Inputs for ClickPost */}
          {selectedProvider === "CLICKPOST" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                ClickPost API Credentials (Optional fallback provided if empty)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ClickPost API Key
                  </label>
                  <input
                    type="password"
                    value={clickpostApiKey}
                    onChange={(e) => setClickpostApiKey(e.target.value)}
                    placeholder="Enter ClickPost API Key"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ClickPost Username
                  </label>
                  <input
                    type="text"
                    value={clickpostUsername}
                    onChange={(e) => setClickpostUsername(e.target.value)}
                    placeholder="Enter ClickPost Username"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Credential Inputs for other API Providers */}
          {selectedProvider !== "SELF_MANUAL" && selectedProvider !== "CLICKPOST" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                {selectedProvider} API Account Credentials (Optional fallback provided if empty)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {selectedProvider} Account Email / API User
                  </label>
                  <input
                    type="text"
                    value={providerEmail}
                    onChange={(e) => setProviderEmail(e.target.value)}
                    placeholder={`your-email@example.com`}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {selectedProvider} API User Password
                  </label>
                  <input
                    type="password"
                    value={providerPassword}
                    onChange={(e) => setProviderPassword(e.target.value)}
                    placeholder="Leave blank to keep existing"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProvider}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              {savingProvider ? "Saving Mode..." : "Save Delivery Mode"}
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: SELF / MANUAL DELIVERY VIEW
          Shows Ordered Details Table with Shipping Options & Status Changing
         ───────────────────────────────────────────────────────────── */}
      {selectedProvider === "SELF_MANUAL" ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Total Orders</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {activeOrders.length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-[11px] font-semibold uppercase text-amber-600 dark:text-amber-400">Pending Delivery</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                {activeOrders.filter((o) => o.paymentStatus === "pending").length}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <p className="text-[11px] font-semibold uppercase text-blue-600 dark:text-blue-400">Paid / Processing</p>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                {activeOrders.filter((o) => o.paymentStatus === "paid").length}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Delivered</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {activeOrders.filter((o) => o.paymentStatus === "delivered").length}
              </p>
            </div>
          </div>

          {/* Self Delivery Orders Table Panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AppIcon name="orders" className="text-orange-500" />
                  Self & Manual Fulfillment Orders
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Assign delivery options and change order status. Updates will instantly synchronize with your Orders table.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(["all", "pending", "paid", "delivered", "cancelled"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelfStatusFilter(st)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                      selfStatusFilter === st
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {st === "all" ? "All Orders" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={selfOrderSearch}
                onChange={(e) => setSelfOrderSearch(e.target.value)}
                placeholder="Search by Order ID, customer name, phone, item, or address..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Orders Table */}
            {filteredSelfOrders.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <AppIcon name="orders" className="text-xl" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {selfOrderSearch || selfStatusFilter !== "all"
                    ? "No orders match your search or filter."
                    : "No orders found in your store yet."}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  When customers place orders, they will appear here for you to fulfill and update.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="pb-3 pl-2">Order #</th>
                      <th className="pb-3">Customer & Address</th>
                      <th className="pb-3">Ordered Items</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Shipping Option</th>
                      <th className="pb-3">Order Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSelfOrders.map((order) => {
                      const orderDisplayId = order.customOrderId || order._id.slice(-6);
                      const currentMethod = selfShippingMethods[order._id] || "Self Hand Delivery";
                      const cleanPhone = (order.customerPhone || "").replace(/\D/g, "");
                      const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                      const waMsg = encodeURIComponent(
                        `Hi ${order.customerName || "Customer"}, regarding your order #${orderDisplayId} from ${
                          seller?.businessName || "our store"
                        }...`
                      );
                      const isUpdating = updatingOrderId === order._id;

                      const itemsSummary =
                        Array.isArray(order.items) && order.items.length > 0
                          ? order.items.map((i) => `${i.productTitle} ×${i.quantity}`).join(", ")
                          : order.product?.title
                          ? `${order.product.title} ×${order.quantity || 1}`
                          : "Product Item";

                      const totalAmt = order.amount + (order.deliveryCharge || 0);

                      return (
                        <tr key={order._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                          {/* Order ID & Date */}
                          <td className="py-3 pl-2 align-top">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              #{orderDisplayId}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </td>

                          {/* Customer & Address */}
                          <td className="py-3 align-top min-w-[180px]">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {order.customerName || "Guest Customer"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {order.customerPhone && (
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="text-[11px] font-mono text-orange-600 hover:underline dark:text-orange-400"
                                >
                                  {order.customerPhone}
                                </a>
                              )}
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  title="Chat on WhatsApp"
                                >
                                  <AppIcon name="whatsapp" className="text-[11px]" />
                                  WA
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" title={order.deliveryAddress}>
                              {order.deliveryAddress || "No address provided"}
                            </p>
                          </td>

                          {/* Ordered Items */}
                          <td className="py-3 align-top min-w-[160px] max-w-[220px]">
                            <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2" title={itemsSummary}>
                              {itemsSummary}
                            </p>
                            {order.note && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 italic line-clamp-1">
                                Note: {order.note}
                              </p>
                            )}
                          </td>

                          {/* Total Amount & Payment Mode */}
                          <td className="py-3 align-top whitespace-nowrap">
                            <p className="font-bold text-slate-900 dark:text-white">
                              ₹{totalAmt.toLocaleString("en-IN")}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                order.paymentMethod === "cod"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300"
                              }`}
                            >
                              {order.paymentMethod === "cod" ? "COD" : "Prepaid"}
                            </span>
                          </td>

                          {/* Shipping / Fulfillment Option Selector */}
                          <td className="py-3 align-top min-w-[170px]">
                            <select
                              value={currentMethod}
                              onChange={(e) => handleSetShippingMethod(order._id, e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm"
                            >
                              {SELF_SHIPPING_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Assigned shipping method
                            </span>
                          </td>

                          {/* Status Change Selector */}
                          <td className="py-3 align-top min-w-[140px]">
                            <select
                              value={order.paymentStatus}
                              disabled={isUpdating}
                              onChange={(e) =>
                                void handleUpdateOrderStatus(order._id, e.target.value as OrderStatus)
                              }
                              className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold uppercase outline-none transition cursor-pointer ${
                                order.paymentStatus === "delivered"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : order.paymentStatus === "paid"
                                  ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : order.paymentStatus === "cancelled"
                                  ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid / In Process</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {isUpdating && (
                              <span className="text-[10px] text-orange-500 animate-pulse mt-0.5 block">
                                Updating status...
                              </span>
                            )}
                          </td>

                          {/* Quick Actions */}
                          <td className="py-3 pr-2 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.paymentStatus !== "delivered" && order.paymentStatus !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => void handleUpdateOrderStatus(order._id, "delivered")}
                                  disabled={isUpdating}
                                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
                                  title="Mark order as Delivered"
                                >
                                  ✓ Delivered
                                </button>
                              )}
                              {onViewOrder && (
                                <button
                                  type="button"
                                  onClick={() => onViewOrder(order)}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                                  title="View Full Order Details"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            MODE 2: AUTOMATED COURIER CARRIER VIEW (Shiprocket / ClickPost / etc.)
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Pickup Setup / Edit Form Modal/Panel */}
          {showPickupForm && (
            <div className="rounded-3xl border-2 border-orange-200 bg-white p-6 dark:border-orange-900/50 dark:bg-slate-900 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AppIcon name="shipping" className="text-orange-500" />
                    {pickupLocation ? "Update Pickup Warehouse Location" : "Confirm Pickup Location"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Couriers will pick up shipments from this warehouse/store location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={prefillFromSeller}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  ↺ Copy Store Profile Address
                </button>
              </div>

              <form onSubmit={handleConfirmPickup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={pickupForm.name}
                      onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
                      placeholder="Contact Person Name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={pickupForm.phone}
                      onChange={(e) => setPickupForm({ ...pickupForm, phone: e.target.value })}
                      placeholder="10-digit Phone"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={pickupForm.email}
                      onChange={(e) => setPickupForm({ ...pickupForm, email: e.target.value })}
                      placeholder="Email for dispatch updates"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Pickup Address (Line 1) *</label>
                    <input
                      type="text"
                      required
                      value={pickupForm.address}
                      onChange={(e) => setPickupForm({ ...pickupForm, address: e.target.value })}
                      placeholder="Shop/Building No, Street Name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Address (Line 2 / Landmark)</label>
                    <input
                      type="text"
                      value={pickupForm.address2}
                      onChange={(e) => setPickupForm({ ...pickupForm, address2: e.target.value })}
                      placeholder="Area, Near Landmark"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={pickupForm.city}
                      onChange={(e) => setPickupForm({ ...pickupForm, city: e.target.value })}
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={pickupForm.state}
                      onChange={(e) => setPickupForm({ ...pickupForm, state: e.target.value })}
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pickupForm.pincode}
                      onChange={(e) => setPickupForm({ ...pickupForm, pincode: e.target.value })}
                      placeholder="6-digit Pincode"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={settingUpPickup}
                    className="rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition"
                  >
                    {settingUpPickup ? "Registering Location..." : "Confirm & Save Pickup Location"}
                  </button>
                  {pickupLocation && (
                    <button
                      type="button"
                      onClick={() => setShowPickupForm(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Subscription & Preference Summary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shipping Status</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">ACTIVE</p>
              {expiryDate && (
                <p className="text-xs text-slate-400 mt-1">
                  Valid until: {new Date(expiryDate).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pickup Location</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate" title={pickupLocation || "Not Configured"}>
                  {pickupLocation || "Not Configured"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {pickupLocation ? `${pickupForm.address || seller?.businessAddress || ""}` : "Pending seller confirmation"}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    prefillFromSeller();
                    setShowPickupForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-950/60 transition"
                >
                  <AppIcon name="shipping" className="text-xs" />
                  {pickupLocation ? "Change Pickup Location" : "Confirm Pickup Location"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courier Preference</p>
              <select
                value={courierPreference}
                onChange={(e) => handleSavePreference(e.target.value)}
                disabled={updatingPref}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {COURIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recent Carrier Shipments Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Store Courier Shipments</h3>
              <span className="text-xs text-slate-400">Total: {shipments.length}</span>
            </div>

            {shipments.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No courier shipments created yet. When you receive orders, you can trigger shipment creation from your Orders tab!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="pb-3">Order Number</th>
                      <th className="pb-3">Courier</th>
                      <th className="pb-3">AWB</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Created Date</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {shipments.map((s) => {
                      const orderObj = typeof s.order === "object" ? s.order : null;
                      return (
                        <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">
                            #{orderObj?.customOrderId || (typeof s.order === "string" ? s.order.slice(-6) : orderObj?._id?.slice(-6) ?? "")}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {s.courierName || "Standard"}
                          </td>
                          <td className="py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                            {s.awbCode || "Pending"}
                          </td>
                          <td className="py-3">
                            {s.status === "CANCELLED" ? (
                              <div>
                                <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                  Cancelled
                                </span>
                                {s.cancellationReason && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={s.cancellationReason}>
                                    {s.cancellationReason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                {s.statusLabel || s.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-xs text-slate-400">
                            {new Date(s.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!s.awbCode && s.status !== "CANCELLED" && (
                                <>
                                  <button
                                    onClick={() => void handleAssignAwb(s._id)}
                                    disabled={assigningAwbId === s._id}
                                    className="rounded-xl border border-blue-400 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 whitespace-nowrap"
                                  >
                                    {assigningAwbId === s._id ? "Assigning..." : "Assign AWB"}
                                  </button>
                                  <button
                                    onClick={() => setCancellingShipment(s)}
                                    className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 whitespace-nowrap"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setTrackingOrderId(String(typeof s.order === "object" ? s.order._id : s.order))}
                                className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400 whitespace-nowrap"
                              >
                                Track →
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Shipment Modal */}
      {cancellingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCancellingShipment(null)}>
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚫</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Shipment</h3>
              </div>
              <button
                onClick={() => setCancellingShipment(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Are you sure you want to cancel the shipment for{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                #{typeof cancellingShipment.order === "object" ? cancellingShipment.order.customOrderId || cancellingShipment.order._id?.slice(-6) : cancellingShipment.order.slice(-6)}
              </span>
              ? Since the AWB is not assigned yet, this will cancel the shipment in Shiprocket and allow you to re-create or adjust it anytime.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="Customer requested cancellation / address change">Customer requested cancellation / address change</option>
                <option value="Package weight / dimensions incorrect">Package weight / dimensions incorrect</option>
                <option value="Need to switch courier partner / method">Need to switch courier partner / method</option>
                <option value="Out of stock / unable to dispatch">Out of stock / unable to dispatch</option>
                <option value="Other">Other (specify below)</option>
              </select>

              {cancelReason === "Other" && (
                <input
                  type="text"
                  placeholder="Enter custom cancellation reason..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingShipment(null)}
                disabled={isCancelling}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Keep Shipment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelShipment}
                disabled={isCancelling}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancel Shipment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrderId && (
        <ShipmentTrackingModal orderId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />
      )}
    </div>
  );
}
