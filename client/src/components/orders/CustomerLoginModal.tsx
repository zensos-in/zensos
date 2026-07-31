import { useState } from "react";
import { api } from "../../api/client";
import { AppIcon } from "../ui/AppIcon";

type Props = {
  sellerSlug: string;
  onClose: () => void;
  onSuccess: (token: string) => void;
};

export function CustomerLoginModal({ sellerSlug, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!phone.trim() || !email.trim()) {
      setError("Please enter both phone and email.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/orders/public/request-otp", {
        sellerSlug,
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
      });
      setSuccess(response.data.message || "OTP sent successfully.");
      setStep("verify");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/orders/public/verify-otp", {
        sellerSlug,
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        otp: otp.trim(),
      });
      onSuccess(response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            View Past Orders
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
          >
            <AppIcon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-400">
              {success}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter the exact phone number and email address you used during checkout. We will email you a secure OTP.
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`mt-2 w-full rounded-xl bg-[#ff751f] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 ${
                  loading ? "opacity-70 pointer-events-none" : ""
                }`}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter the 6-digit OTP sent to <strong>{email}</strong>.
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-lg font-bold tracking-widest outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="------"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`mt-2 w-full rounded-xl bg-[#ff751f] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 ${
                  loading ? "opacity-70 pointer-events-none" : ""
                }`}
              >
                {loading ? "Verifying..." : "Verify & View Orders"}
              </button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setOtp("");
                    setSuccess("");
                    setError("");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Go back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
