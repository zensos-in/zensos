export interface OfferBenefit {
  id: string;
  title: string;
  description: string;
}

export interface OfferTerm {
  number: number;
  title: string;
  content: string;
}

export interface ComplimentaryOfferConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  badgeText: string;
  sellerLimit: number;
  sellerLimitLabel: string;
  promotionalMessage: string;
  qualifyingNote: string;
  eligiblePlans: Array<"GROWTH" | "BUSINESS">;
  minimumCommitmentMonths: number;
  minimumMonthlyPrice: number;
  reelCount: number;
  metaAdValue: number;
  benefits: OfferBenefit[];
  modalTitle: string;
  terms: OfferTerm[];
}

export const COMPLIMENTARY_OFFER_CONFIG: ComplimentaryOfferConfig = {
  enabled: true,
  title: "Complimentary Offer",
  subtitle: "Partner Spotlight Offer",
  badgeText: "LIMITED OFFER",
  sellerLimit: 30,
  sellerLimitLabel: "For first 30 sellers",
  promotionalMessage:
    "Sign-up for Growth plan or Business plan for a minimum of 3 months and get complimentary offer of 2 reels and INR 500 worth Meta Ad campaign for your brand!",
  qualifyingNote:
    "Applicable exclusively to qualifying quarterly subscriptions (3-month minimum commitment) on Growth and Business plans.",
  eligiblePlans: ["GROWTH", "BUSINESS"],
  minimumCommitmentMonths: 3,
  minimumMonthlyPrice: 1499, // Minimum monthly plan price before GST (INR)
  reelCount: 2,
  metaAdValue: 500, // INR
  benefits: [
    {
      id: "benefit-reels",
      title: "2 Brand Feature Reels on ZENSOS Instagram handle",
      description:
        "We will deliver 2 shoutout reels on the official Instagram handle of ZENSOS during your subscription period.",
    },
    {
      id: "benefit-ads",
      title: "Ad campaign on Facebook and Instagram worth INR 500",
      description:
        "We help your brand reach a wider audience, maximize awareness and store visits by running a Meta Ad campaign with INR 500 for the reels we create for your brand on ZENSOS.",
    },
  ],
  modalTitle: "Terms & Conditions: Zensos Partner Spotlight Offer",
  terms: [
    {
      number: 1,
      title: "Offer Eligibility",
      content:
        "This complimentary offer is exclusively available to new or upgrading clients who subscribe to the Growth or Business plan for a minimum upfront commitment of 3 months.",
    },
    {
      number: 2,
      title: "Content Ownership & Placement",
      content:
        "The 2 complimentary Reels will be produced by Zensos and published exclusively on the official Zensos Instagram handle. This is a brand feature/shoutout on our platform, not a custom video production or influencer marketing service. We do not provide raw video files or content for clients to post on their own personal or business social media accounts.",
    },
    {
      number: 3,
      title: "No On-Site Shoots",
      content:
        "All content will be created remotely by the Zensos team using brand assets, logos, and product information provided by the client. We will not conduct physical, on-site video shoots at the client’s location as part of this offer.",
    },
    {
      number: 4,
      title: "Ad Spend & Distribution",
      content:
        "The ₹500 Meta Ads boost is entirely managed and funded by Zensos. The ads will be run exclusively through the Zensos Meta/Instagram advertising accounts to promote the featured Reels. Ads will not be run on the client’s ad accounts or on any external platforms such as Google, YouTube, or LinkedIn.",
    },
    {
      number: 5,
      title: "Asset Requirements",
      content:
        "To fulfill the offer, clients must provide high-quality product images and basic business details within 14 days of onboarding. Zensos reserves the right to delay or forfeit the feature if the required assets are not provided.",
    },
    {
      number: 6,
      title: "Non-Transferable",
      content:
        "This offer holds no cash value, cannot be exchanged for a discount on subscription fees, and cannot be transferred to another brand or entity.",
    },
  ],
};

export interface EligibilityCheckParams {
  isNewOrUpgradingCustomer: boolean;
  plan: string;
  billingCommitmentMonths: number;
  monthlyPlanPrice: number;
}

/**
 * Checks promotional eligibility for the Partner Spotlight / Complimentary Offer.
 * Separated cleanly from core subscription processing logic.
 */
export function checkComplimentaryOfferEligibility({
  isNewOrUpgradingCustomer,
  plan,
  billingCommitmentMonths,
  monthlyPlanPrice,
}: EligibilityCheckParams): boolean {
  if (!COMPLIMENTARY_OFFER_CONFIG.enabled) return false;

  const normalizedPlan = (plan || "").toUpperCase() as "GROWTH" | "BUSINESS";
  const isEligiblePlan = COMPLIMENTARY_OFFER_CONFIG.eligiblePlans.includes(normalizedPlan);
  const hasMinCommitment = billingCommitmentMonths >= COMPLIMENTARY_OFFER_CONFIG.minimumCommitmentMonths;
  const hasMinPrice = monthlyPlanPrice >= COMPLIMENTARY_OFFER_CONFIG.minimumMonthlyPrice;

  return Boolean(isNewOrUpgradingCustomer && isEligiblePlan && hasMinCommitment && hasMinPrice);
}
