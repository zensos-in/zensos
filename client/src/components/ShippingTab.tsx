import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AppIcon } from "./ui/AppIcon";
import { ShipmentTrackingModal } from "./ShipmentTrackingModal";
import type { Shipment, CourierPreference } from "../types";

/* UNCOMMENT WHEN READY FOR PRODUCTION PAYMENT FLOW
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
*/

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
  { id: "NIMBUSPOST", name: "NimbusPost", description: "Advanced ecommerce multi-carrier shipping automation" },
  { id: "VELOCITY", name: "Velocity", description: "High-speed logistics and warehousing delivery" },
  { id: "SELF_MANUAL", name: "Self / Manual Delivery", description: "Direct local delivery or self-managed courier dispatch" },
];

export function ShippingTab() {
  const { seller, refreshProfile } = useAuth();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  // TEMPORARY TEST MODE: Enabled by default without Razorpay payment
  const [isAddonActive, setIsAddonActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [courierPreference, setCourierPreference] = useState<string>("BEST_AVAILABLE");

  // Provider Settings
  const [selectedProvider, setSelectedProvider] = useState<string>("SHIPROCKET");
  const [providerEmail, setProviderEmail] = useState<string>("");
  const [providerPassword, setProviderPassword] = useState<string>("");
  const [savingProvider, setSavingProvider] = useState(false);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  // const [purchasing, setPurchasing] = useState(false);
  const [settingUpPickup, setSettingUpPickup] = useState(false);
  const [updatingPref, setUpdatingPref] = useState(false);

  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  // Pickup location configuration & edit form state
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
      const [resStatus, resShipments] = await Promise.all([
        api.get<{
          isAddonActive: boolean;
          seller: {
            deliveryAddonStatus: string;
            deliveryAddonExpiresAt: string | null;
            preferredLogisticsProvider?: string;
            shiprocketEmail?: string;
            nimbuspostEmail?: string;
            velocityEmail?: string;
            shiprocketPickupLocation: string;
            courierPreference: string;
          };
        }>("/delivery-addon/status"),
        api.get<{ shipments: Shipment[] }>("/shipping/shipments").catch(() => ({ data: { shipments: [] } })),
      ]);

      // TEMPORARY TEST MODE: Forced active for testing
      setIsAddonActive(true);
      setExpiryDate(resStatus.data.seller.deliveryAddonExpiresAt);
      const loc = resStatus.data.seller.shiprocketPickupLocation || "";
      setPickupLocation(loc);
      setCourierPreference(resStatus.data.seller.courierPreference || "BEST_AVAILABLE");
      setSelectedProvider(resStatus.data.seller.preferredLogisticsProvider || "SHIPROCKET");
      setProviderEmail(
        resStatus.data.seller.preferredLogisticsProvider === "NIMBUSPOST"
          ? resStatus.data.seller.nimbuspostEmail || ""
          : resStatus.data.seller.preferredLogisticsProvider === "VELOCITY"
          ? resStatus.data.seller.velocityEmail || ""
          : resStatus.data.seller.shiprocketEmail || ""
      );
      setShipments(resShipments.data.shipments || []);

      // If active add-on but no pickup location configured yet, open the confirmation form
      if (!loc) {
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

  /* UNCOMMENT WHEN READY FOR PRODUCTION PAYMENT FLOW
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
        // Dev / Mock flow
        await api.post("/delivery-addon/verify-payment", {
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_addon_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          addonSubscriptionId,
        });

        showSuccess("Shipping Add-on activated! Please confirm your pickup location.");
        await refreshProfile();
        fetchStatus();
        setShowPickupForm(true);
        prefillFromSeller();
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
          description: "Delivery Partner Add-on (₹200)",
          order_id: orderId,
          handler: async function (response: any) {
            try {
              await api.post("/delivery-addon/verify-payment", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                addonSubscriptionId,
              });
              showSuccess("Shipping Add-on activated! Please confirm your pickup location.");
              await refreshProfile();
              fetchStatus();
              setShowPickupForm(true);
              prefillFromSeller();
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
  */

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
              Automate courier shipping, print labels, and provide live customer tracking across your preferred logistics network.
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isAddonActive ? "Shipping Feature ACTIVE" : "Shipping Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE STATE CONFIGURATION & DASHBOARD */}
      <div className="space-y-6">
        {/* Logistics Provider & Credentials Setup */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AppIcon name="truck" className="text-orange-500" />
                Logistics Courier Provider
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select your preferred courier integration partner or use your own custom credentials.
              </p>
            </div>
            <span className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/50 dark:border-orange-900/50 dark:text-orange-400">
              Active: {selectedProvider}
            </span>
          </div>

          <form onSubmit={handleSaveProvider} className="space-y-4">
            {/* Provider Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* Credential Inputs for API Providers */}
            {selectedProvider !== "SELF_MANUAL" && (
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
                {savingProvider ? "Saving Provider..." : "Save Provider Settings"}
              </button>
            </div>
          </form>
        </div>

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

        {/* Recent Shipments Table */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Store Shipments</h3>
            <span className="text-xs text-slate-400">Total: {shipments.length}</span>
          </div>

          {shipments.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No shipments created yet. When you receive orders, you can trigger shipment creation from your Orders tab!
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
                          <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {s.statusLabel || s.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-400">
                          {new Date(s.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setTrackingOrderId(String(typeof s.order === "object" ? s.order._id : s.order))}
                            className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400"
                          >
                            Track →
                          </button>
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

      {/* Tracking Modal */}
      {trackingOrderId && (
        <ShipmentTrackingModal orderId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />
      )}
    </div>
  );
}
