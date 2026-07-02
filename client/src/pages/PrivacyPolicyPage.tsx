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
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
      <span>{children}</span>
    </li>
  );
}

const TOC = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "sharing", label: "Sharing of Information" },
  { id: "payments", label: "Payments & Financial Data" },
  { id: "sellers", label: "Seller / Vendor Data" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "retention", label: "Data Retention" },
  { id: "security", label: "Security" },
  { id: "rights", label: "Your Rights" },
  { id: "children", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            🔒 Privacy Policy
          </span>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Your Privacy Matters
          </h1>
          <p className="mt-4 text-lg text-teal-100">
            We are committed to protecting your personal data and being transparent about how we use it.
          </p>
          <p className="mt-3 text-sm text-teal-200">Last updated: {LAST_UPDATED}</p>
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
                    className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
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

              <p className="mb-10 rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-300">
                This Privacy Policy applies to <strong>{PLATFORM_NAME}</strong> ({PLATFORM_URL}), a multi-vendor
                marketplace platform that connects buyers with independent sellers. By using our platform, you
                agree to the collection and use of information as described below.
              </p>

              <div className="space-y-12">

                <Section id="information-we-collect" title="1. Information We Collect">
                  <p><strong className="text-slate-800 dark:text-slate-200">From Buyers:</strong></p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Name, phone number, and email address when placing an order</Bullet>
                    <Bullet>Delivery and billing addresses</Bullet>
                    <Bullet>Order history and transaction references</Bullet>
                    <Bullet>Device information and browsing behaviour on our platform</Bullet>
                  </ul>
                  <p className="pt-2"><strong className="text-slate-800 dark:text-slate-200">From Sellers:</strong></p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Business name, registered address, and contact details</Bullet>
                    <Bullet>PAN number and KYC documents (identity and address proof)</Bullet>
                    <Bullet>Bank account details for settlement via Razorpay Route</Bullet>
                    <Bullet>Store branding assets (logo, banner, product images)</Bullet>
                    <Bullet>Product and inventory information</Bullet>
                  </ul>
                </Section>

                <Section id="how-we-use" title="2. How We Use Your Information">
                  <ul className="space-y-2 pl-1">
                    <Bullet>To process and fulfil orders placed on the marketplace</Bullet>
                    <Bullet>To route vendor payments through Razorpay's linked account (Route) system</Bullet>
                    <Bullet>To verify seller identity and comply with RBI / Razorpay KYC requirements</Bullet>
                    <Bullet>To send order confirmations and status updates via email / SMS</Bullet>
                    <Bullet>To detect fraud, prevent abuse, and enforce our Terms of Use</Bullet>
                    <Bullet>To improve platform performance and user experience</Bullet>
                    <Bullet>To comply with applicable Indian laws and regulations</Bullet>
                  </ul>
                  <p className="pt-2">
                    We do <strong className="text-slate-800 dark:text-slate-200">not</strong> sell your personal data to third parties for marketing purposes.
                  </p>
                </Section>

                <Section id="sharing" title="3. Sharing of Information">
                  <p>We share your data only when necessary:</p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>
                      <strong className="text-slate-800 dark:text-slate-200">With Sellers:</strong> Buyer name,
                      phone, and delivery address are shared with the relevant seller to fulfil the order.
                    </Bullet>
                    <Bullet>
                      <strong className="text-slate-800 dark:text-slate-200">With Razorpay:</strong> Payment and
                      KYC data is processed by Razorpay (our payment partner). Their privacy policy applies to
                      data processed on their systems.
                    </Bullet>
                    <Bullet>
                      <strong className="text-slate-800 dark:text-slate-200">With Legal Authorities:</strong> When
                      required by Indian law, court order, or government authority.
                    </Bullet>
                    <Bullet>
                      <strong className="text-slate-800 dark:text-slate-200">Service Providers:</strong> Cloud
                      hosting, email delivery, and analytics providers under strict confidentiality agreements.
                    </Bullet>
                  </ul>
                </Section>

                <Section id="payments" title="4. Payments & Financial Data">
                  <p>
                    All payments are processed securely by <strong className="text-slate-800 dark:text-slate-200">Razorpay</strong>.
                    {PLATFORM_NAME} does not store your card numbers, UPI PINs, or net-banking credentials.
                  </p>
                  <p>
                    When you pay, funds are collected by the platform and automatically split: the
                    vendor's share is transferred directly to the seller's Razorpay linked account, and
                    the platform commission stays in the platform account. All transfers are governed by
                    Razorpay Route.
                  </p>
                </Section>

                <Section id="sellers" title="5. Seller / Vendor Data">
                  <p>
                    Sellers registered on {PLATFORM_NAME} provide sensitive business and identity information
                    for KYC verification and payment onboarding. This data is:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Encrypted at rest (PAN and identity documents)</Bullet>
                    <Bullet>Transmitted to Razorpay only to complete linked account onboarding</Bullet>
                    <Bullet>Accessible only to authorised platform administrators</Bullet>
                    <Bullet>Never shared with other sellers or third parties for commercial purposes</Bullet>
                  </ul>
                </Section>

                <Section id="cookies" title="6. Cookies & Tracking">
                  <p>
                    We use minimal cookies necessary for session management and platform functionality.
                    We do not use third-party advertising cookies. Browser local storage is used to
                    preserve your cart and authentication state across sessions.
                  </p>
                </Section>

                <Section id="retention" title="7. Data Retention">
                  <ul className="space-y-2 pl-1">
                    <Bullet>Order data is retained for 7 years for accounting and legal compliance</Bullet>
                    <Bullet>KYC documents are retained for as long as a seller account is active, plus 5 years</Bullet>
                    <Bullet>You may request deletion of your account data subject to legal retention obligations</Bullet>
                  </ul>
                </Section>

                <Section id="security" title="8. Security">
                  <p>
                    We implement industry-standard security measures including HTTPS encryption, access
                    controls, and encrypted storage of sensitive fields. However, no method of transmission
                    over the internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </Section>

                <Section id="rights" title="9. Your Rights">
                  <p>Under applicable Indian privacy laws, you have the right to:</p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Access the personal data we hold about you</Bullet>
                    <Bullet>Request correction of inaccurate data</Bullet>
                    <Bullet>Request deletion of your data (subject to legal obligations)</Bullet>
                    <Bullet>Withdraw consent for processing where consent is the legal basis</Bullet>
                  </ul>
                  <p className="pt-2">
                    To exercise any of these rights, contact us at{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-teal-600 underline underline-offset-2 hover:text-teal-700 dark:text-teal-400">
                      {CONTACT_EMAIL}
                    </a>.
                  </p>
                </Section>

                <Section id="children" title="10. Children's Privacy">
                  <p>
                    {PLATFORM_NAME} is not directed at individuals under the age of 18. We do not
                    knowingly collect personal data from minors. If you believe a minor has provided
                    us data, please contact us immediately.
                  </p>
                </Section>

                <Section id="changes" title="11. Changes to This Policy">
                  <p>
                    We may update this Privacy Policy from time to time. Significant changes will be
                    communicated via email or a prominent notice on the platform. Continued use of the
                    platform after changes constitutes acceptance of the updated policy.
                  </p>
                </Section>

                <Section id="contact" title="12. Contact Us">
                  <p>For any privacy-related questions or concerns:</p>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{PLATFORM_NAME}</p>
                    <p className="mt-1 text-sm">
                      Email:{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-teal-600 hover:underline dark:text-teal-400">
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <p className="mt-1 text-sm">Website: <a href={PLATFORM_URL} className="font-medium text-teal-600 hover:underline dark:text-teal-400">{PLATFORM_URL}</a></p>
                  </div>
                </Section>

              </div>
            </div>

            {/* Footer nav */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <Link to="/terms" className="hover:text-teal-600 dark:hover:text-teal-400">Terms of Use</Link>
              <span>·</span>
              <Link to="/refund-policy" className="hover:text-teal-600 dark:hover:text-teal-400">Refund Policy</Link>
              <span>·</span>
              <Link to="/privacy-policy" className="font-semibold text-teal-600 dark:text-teal-400">Privacy Policy</Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
