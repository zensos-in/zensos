import { useState } from "react";
import type { OfferBenefit } from "../../constants/complimentaryOffer";

interface OfferBenefitAccordionProps {
  benefits: OfferBenefit[];
  defaultOpenIndex?: number | null;
}

export function OfferBenefitAccordion({
  benefits,
  defaultOpenIndex = 0,
}: OfferBenefitAccordionProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    benefits.forEach((benefit, idx) => {
      initial[benefit.id] = defaultOpenIndex === idx;
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-3 w-full">
      {benefits.map((benefit, index) => {
        const isOpen = !!openItems[benefit.id];
        const contentId = `benefit-content-${benefit.id}`;
        const headerId = `benefit-header-${benefit.id}`;

        return (
          <div
            key={benefit.id}
            className="overflow-hidden rounded-2xl border transition-all duration-200"
            style={{
              background: isOpen ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.8)",
              borderColor: isOpen ? "rgba(255, 117, 31, 0.35)" : "rgba(255, 117, 31, 0.15)",
              boxShadow: isOpen
                ? "0 8px 24px rgba(255, 117, 31, 0.12)"
                : "0 2px 8px rgba(11, 24, 63, 0.03)",
            }}
          >
            <button
              id={headerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggleItem(benefit.id)}
              className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-white font-black text-sm shadow-sm"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #f09433, #dc2743)"
                        : "linear-gradient(135deg, #6366f1, #3b82f6)",
                  }}
                >
                  {index === 0 ? "🎬" : "📢"}
                </div>
                <h4
                  className="text-sm sm:text-base font-bold text-[#0b183f] tracking-tight leading-snug"
                >
                  {benefit.title}
                </h4>
              </div>

              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300"
                style={{
                  background: isOpen ? "rgba(255, 117, 31, 0.15)" : "rgba(11, 24, 63, 0.05)",
                  color: isOpen ? "#ff751f" : "#64748b",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
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
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div
                id={contentId}
                role="region"
                aria-labelledby={headerId}
                className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-left text-xs sm:text-sm leading-relaxed text-slate-600 animate-in fade-in duration-200 border-t border-orange-50 pt-3"
              >
                <p>{benefit.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
