import { Link } from "react-router-dom";

const LAST_UPDATED = "2 July 2025";
const CONTACT_EMAIL = "support@zensos.in";
const PLATFORM_NAME = "Zensos";
const PLATFORM_URL = "https://zensos.in";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 font-heading text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
      <span>{children}</span>
    </li>
  );
}

const TOC = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "eligibility", label: "Eligibility" },
  { id: "platform-role", label: "Platform Role" },
  { id: "buyer-obligations", label: "Buyer Obligations" },
  { id: "seller-obligations", label: "Seller Obligations" },
  { id: "payments", label: "Payments & Fees" },
  { id: "prohibited", label: "Prohibited Activities" },
  { id: "ip", label: "Intellectual Property" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

export function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-purple-700 px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            📋 Terms of Use
          </span>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Terms of Use
          </h1>
          <p className="mt-4 text-lg text-violet-100">
            Please read these terms carefully before using the Zensos marketplace platform.
          </p>
          <p className="mt-3 text-sm text-violet-200">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

          {/* Sticky Table of Contents */}
          <aside className="lg:w-64 lg:shrink-0">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Contents</p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-violet-950/40 dark:hover:text-violet-300"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-10 sm:py-10">

              <p className="mb-10 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300">
                These Terms of Use govern your access to and use of <strong>{PLATFORM_NAME}</strong> ({PLATFORM_URL}).
                By registering as a buyer or seller, or by browsing our marketplace, you agree to be bound by these terms.
                If you do not agree, please discontinue use immediately.
              </p>

              <div className="space-y-12">

                <Section id="acceptance" title="1. Acceptance of Terms">
                  <p>
                    By accessing {PLATFORM_NAME}, you confirm that you have read, understood, and agree to these
                    Terms of Use, our Privacy Policy, and our Refund Policy. These terms constitute a legally
                    binding agreement between you and {PLATFORM_NAME}.
                  </p>
                  <p>
                    We reserve the right to modify these terms at any time. Continued use of the platform after
                    any changes constitutes your acceptance of the revised terms.
                  </p>
                </Section>

                <Section id="eligibility" title="2. Eligibility">
                  <ul className="space-y-2 pl-1">
                    <Bullet>You must be at least 18 years of age to use this platform</Bullet>
                    <Bullet>Sellers must be legal entities or individuals legally permitted to conduct business in India</Bullet>
                    <Bullet>By using the platform, you represent that all registration information you provide is accurate and current</Bullet>
                    <Bullet>Accounts registered with false information may be suspended or permanently removed</Bullet>
                  </ul>
                </Section>

                <Section id="platform-role" title="3. Platform Role">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">{PLATFORM_NAME} is a marketplace intermediary.</strong>{" "}
                    We provide the technology platform that enables independent sellers to list their products and
                    buyers to discover and purchase them.
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>We are not the seller of record for any product listed on the platform</Bullet>
                    <Bullet>Individual sellers are responsible for the accuracy of their product listings, pricing, and fulfilment</Bullet>
                    <Bullet>
                      Contracts of sale are formed directly between the buyer and the seller. {PLATFORM_NAME} is
                      not a party to that contract
                    </Bullet>
                    <Bullet>We collect payments on behalf of sellers and disburse funds via Razorpay Route after deducting our platform commission</Bullet>
                  </ul>
                </Section>

                <Section id="buyer-obligations" title="4. Buyer Obligations">
                  <p>As a buyer on {PLATFORM_NAME}, you agree to:</p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Provide accurate delivery address and contact information when placing orders</Bullet>
                    <Bullet>Make payment in full at the time of checkout for prepaid orders</Bullet>
                    <Bullet>Be available to receive your delivery at the address provided</Bullet>
                    <Bullet>Raise any complaints or return requests within the timeframe specified in our Refund Policy</Bullet>
                    <Bullet>Not attempt to fraudulently initiate chargebacks for orders that were delivered correctly</Bullet>
                  </ul>
                </Section>

                <Section id="seller-obligations" title="5. Seller Obligations">
                  <p>As a seller on {PLATFORM_NAME}, you agree to:</p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Complete KYC verification including PAN and identity documents before your store goes live</Bullet>
                    <Bullet>List only products you are legally authorised to sell</Bullet>
                    <Bullet>Maintain accurate product descriptions, images, and pricing</Bullet>
                    <Bullet>Fulfil orders promptly and provide tracking information where applicable</Bullet>
                    <Bullet>Handle returns and complaints as per our Refund Policy</Bullet>
                    <Bullet>Not list counterfeit, illegal, or prohibited goods</Bullet>
                    <Bullet>Keep your bank account and contact details current to receive settlements</Bullet>
                    <Bullet>Comply with all applicable Indian tax laws, including GST obligations</Bullet>
                  </ul>
                  <p className="pt-2">
                    Sellers who violate these obligations may have their stores suspended or permanently removed
                    without prior notice.
                  </p>
                </Section>

                <Section id="payments" title="6. Payments & Fees">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Buyers</strong> pay the full listed
                    price (including the platform commission) at checkout. Payments are processed securely by Razorpay.
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Sellers</strong> receive the net amount
                    (product revenue + delivery charge) after the platform commission is deducted. Settlements are
                    transferred to your Razorpay linked account within Razorpay's standard settlement timeline
                    after the platform commission is deducted.
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Platform commission percentages are set by the platform administrator and communicated to sellers</Bullet>
                    <Bullet>Commission rates may be updated with reasonable notice</Bullet>
                    <Bullet>Razorpay's own processing fees apply separately as per their pricing</Bullet>
                  </ul>
                </Section>

                <Section id="prohibited" title="7. Prohibited Activities">
                  <p>The following activities are strictly prohibited on {PLATFORM_NAME}:</p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Listing or selling counterfeit, pirated, or stolen goods</Bullet>
                    <Bullet>Fraudulent orders, fake reviews, or manipulation of ratings</Bullet>
                    <Bullet>Circumventing the payment system to transact outside the platform</Bullet>
                    <Bullet>Collecting buyer personal data for purposes other than order fulfilment</Bullet>
                    <Bullet>Reverse-engineering, scraping, or otherwise accessing the platform by automated means without written permission</Bullet>
                    <Bullet>Uploading malicious content, spam, or content that infringes third-party rights</Bullet>
                  </ul>
                </Section>

                <Section id="ip" title="8. Intellectual Property">
                  <p>
                    All platform content, branding, and technology (excluding seller-uploaded content) is the
                    intellectual property of {PLATFORM_NAME}. Sellers retain ownership of their product images
                    and descriptions but grant {PLATFORM_NAME} a licence to display this content on the platform
                    for the purpose of facilitating sales.
                  </p>
                </Section>

                <Section id="liability" title="9. Limitation of Liability">
                  <p>
                    To the maximum extent permitted by law, {PLATFORM_NAME} shall not be liable for:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>The quality, safety, or legality of products listed by sellers</Bullet>
                    <Bullet>Delivery delays or failures caused by sellers or third-party logistics providers</Bullet>
                    <Bullet>Any indirect, incidental, or consequential loss arising from use of the platform</Bullet>
                    <Bullet>Platform downtime, data loss, or errors beyond our reasonable control</Bullet>
                  </ul>
                  <p className="pt-2">
                    Our total liability to any party shall not exceed the amount of the transaction giving rise to the claim.
                  </p>
                </Section>

                <Section id="termination" title="10. Termination">
                  <p>
                    We reserve the right to suspend or terminate any account — buyer or seller — at our sole
                    discretion for violation of these terms, fraudulent activity, or behaviour that harms other
                    users or the platform.
                  </p>
                  <p>
                    Sellers who are terminated will receive any pending settlement amounts owed to them (after
                    deducting any chargebacks or outstanding platform fees) within Razorpay's standard settlement window.
                  </p>
                </Section>

                <Section id="governing-law" title="11. Governing Law">
                  <p>
                    These Terms of Use are governed by the laws of India. Any disputes arising from these terms
                    shall be subject to the exclusive jurisdiction of the courts located in India. We encourage
                    amicable resolution through our support team before resorting to legal proceedings.
                  </p>
                </Section>

                <Section id="contact" title="12. Contact">
                  <p>For questions about these Terms of Use:</p>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{PLATFORM_NAME}</p>
                    <p className="mt-1 text-sm">
                      Email:{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-violet-600 hover:underline dark:text-violet-400">
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <p className="mt-1 text-sm">Website: <a href={PLATFORM_URL} className="font-medium text-violet-600 hover:underline dark:text-violet-400">{PLATFORM_URL}</a></p>
                  </div>
                </Section>

              </div>
            </div>

            {/* Footer nav */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <Link to="/terms" className="font-semibold text-violet-600 dark:text-violet-400">Terms of Use</Link>
              <span>·</span>
              <Link to="/refund-policy" className="hover:text-violet-600 dark:hover:text-violet-400">Refund Policy</Link>
              <span>·</span>
              <Link to="/privacy-policy" className="hover:text-violet-600 dark:hover:text-violet-400">Privacy Policy</Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
