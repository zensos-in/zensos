import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COMPLIMENTARY_OFFER_CONFIG } from "../../constants/complimentaryOffer";
import { OfferBenefitAccordion } from "./OfferBenefitAccordion";
import { OfferTermsModal } from "./OfferTermsModal";

interface ComplimentaryOfferProps {
  onGetOffer?: () => void;
  className?: string;
}

export function ComplimentaryOffer({
  onGetOffer,
  className = "",
}: ComplimentaryOfferProps) {
  const navigate = useNavigate();
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleGetOffer = () => {
    if (onGetOffer) {
      onGetOffer();
    } else {
      navigate("/login?tab=register&plan=GROWTH");
    }
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all duration-500 p-6 sm:p-8 lg:p-10 ${className}`}
        style={{
          background: "linear-gradient(145deg, #0b183f 0%, #0f2157 55%, #1a1060 100%)",
          borderColor: "rgba(255, 117, 31, 0.3)",
          boxShadow: "0 20px 50px rgba(11, 24, 63, 0.25), 0 0 40px rgba(255, 117, 31, 0.12)",
        }}
      >
        {/* Ambient background glow & grid */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #ff751f, transparent 70%)" }} />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left Column: Heading, Badges, Promotional Copy */}
          <div className="flex-1 text-left">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #ff751f, #ff4500)" }}
              >
                ✦ {COMPLIMENTARY_OFFER_CONFIG.badgeText}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-orange-300"
                style={{
                  background: "rgba(255, 117, 31, 0.15)",
                  border: "1px solid rgba(255, 117, 31, 0.3)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                {COMPLIMENTARY_OFFER_CONFIG.sellerLimitLabel}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              {COMPLIMENTARY_OFFER_CONFIG.title}
              <span className="block text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #ff751f, #ffb347)" }}>
                {COMPLIMENTARY_OFFER_CONFIG.subtitle}
              </span>
            </h3>

            {/* Prominent Promotional Message */}
            <p className="text-sm sm:text-base lg:text-lg font-medium text-slate-200 leading-relaxed mb-4">
              {COMPLIMENTARY_OFFER_CONFIG.promotionalMessage}
            </p>

            {/* Qualifying Quarterly Note */}
            <div className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-orange-200/90 mb-6 bg-orange-950/30 border border-orange-500/20">
              <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span>{COMPLIMENTARY_OFFER_CONFIG.qualifyingNote}</span>
            </div>

            {/* Actions: Primary CTA and Terms Link */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="button"
                onClick={handleGetOffer}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm sm:text-base font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{
                  background: "linear-gradient(135deg, #ff751f, #ff4500)",
                  boxShadow: "0 8px 28px rgba(255, 117, 31, 0.4)",
                }}
              >
                <span>Get Offer</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-orange-400 underline underline-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 rounded-lg p-1"
              >
                <span>Terms of Offer</span>
                <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column: Accordion with Benefits */}
          <div className="w-full lg:max-w-md xl:max-w-lg shrink-0">
            <div className="rounded-2xl p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                  Included Benefits
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Click to view details
                </span>
              </div>
              <OfferBenefitAccordion benefits={COMPLIMENTARY_OFFER_CONFIG.benefits} defaultOpenIndex={0} />
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      <OfferTermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </>
  );
}
