import { useEffect } from "react";
import { COMPLIMENTARY_OFFER_CONFIG } from "../../constants/complimentaryOffer";

interface OfferTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfferTermsModal({ isOpen, onClose }: OfferTermsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-terms-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-10 overflow-hidden"
        style={{
          maxHeight: "min(88vh, 720px)",
          animation: "modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between border-b px-6 py-5 shrink-0 border-slate-100 dark:border-slate-800"
          style={{ background: "linear-gradient(135deg, #fff7f0 0%, #ffffff 100%)" }}
        >
          <div className="pr-4">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff751f] animate-pulse" />
              Official Offer Terms
            </div>
            <h3
              id="offer-terms-title"
              className="text-xl sm:text-2xl font-black tracking-tight"
              style={{ color: "#0b183f" }}
            >
              {COMPLIMENTARY_OFFER_CONFIG.modalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms of Offer Modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Terms List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 text-left custom-scrollbar">
          {COMPLIMENTARY_OFFER_CONFIG.terms.map((term) => (
            <div
              key={term.number}
              className="rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 sm:p-5 transition-colors hover:border-orange-200 dark:hover:border-orange-950/60"
              style={{ background: "rgba(248, 250, 252, 0.7)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #ff751f, #ff4500)" }}
                >
                  {term.number}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {term.title}
                </h4>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 pl-10">
                {term.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 shrink-0 border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/90">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Offer subject to fulfillment window and asset submission.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #ff751f, #ff4500)" }}
          >
            I Understand
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
