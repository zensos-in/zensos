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
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
      <span>{children}</span>
    </li>
  );
}

function PolicyCard({
  icon,
  title,
  description,
  badge,
  badgeColor,
}: {
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-2xl">{icon}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

const TOC = [
  { id: "overview", label: "Policy Overview" },
  { id: "prepaid-orders", label: "Prepaid Orders" },
  { id: "cod-orders", label: "Cash on Delivery Orders" },
  { id: "return-process", label: "Return Process" },
  { id: "eligible-items", label: "Eligible & Ineligible Items" },
  { id: "refund-timeline", label: "Refund Timeline" },
  { id: "damaged-items", label: "Damaged / Wrong Items" },
  { id: "seller-responsibility", label: "Seller Responsibility" },
  { id: "platform-fees", label: "Platform Fees on Refunds" },
  { id: "disputes", label: "Disputes" },
  { id: "contact", label: "Contact Us" },
];

export function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            💸 Refund Policy
          </span>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Refund & Return Policy
          </h1>
          <p className="mt-4 text-lg text-orange-100">
            We want every purchase on Zensos to be a great experience. Here's how returns and refunds work.
          </p>
          <p className="mt-3 text-sm text-orange-200">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Quick summary cards */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <PolicyCard
            icon="📦"
            title="Prepaid Orders"
            description="Refund to original payment method within 5–7 business days after return is approved"
            badge="Eligible"
            badgeColor="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          />
          <PolicyCard
            icon="🚚"
            title="COD Orders"
            description="Refund via bank transfer or UPI within 7–10 business days after return is received"
            badge="Eligible"
            badgeColor="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          />
          <PolicyCard
            icon="⏰"
            title="Raise Request Within"
            description="Returns and refund requests must be raised within 7 days of delivery"
            badge="7 Days"
            badgeColor="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
                    className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-orange-950/40 dark:hover:text-orange-300"
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

              <p className="mb-10 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
                <strong>{PLATFORM_NAME}</strong> is a marketplace intermediary. Each product is sold and fulfilled by
                an independent seller. Refund and return decisions are made jointly by the seller and
                {" "}{PLATFORM_NAME} in line with this policy. We are committed to fair outcomes for both buyers and sellers.
              </p>

              <div className="space-y-12">

                <Section id="overview" title="1. Policy Overview">
                  <p>
                    We accept return and refund requests in the following scenarios:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>You received a damaged or defective product</Bullet>
                    <Bullet>You received a product that is significantly different from what was described</Bullet>
                    <Bullet>You received the wrong product</Bullet>
                    <Bullet>Your order was not delivered within the estimated delivery window and cannot be traced</Bullet>
                  </ul>
                  <p className="pt-2">
                    Change-of-mind returns are subject to the individual seller's return policy. Sellers may
                    choose to accept or decline change-of-mind returns at their discretion.
                  </p>
                </Section>

                <Section id="prepaid-orders" title="2. Prepaid Orders (UPI, Cards, Net Banking)">
                  <p>
                    If your return is approved for a prepaid order:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>The refund will be credited to your original payment instrument (UPI ID, credit/debit card, or bank account)</Bullet>
                    <Bullet>Refunds are processed within <strong className="text-slate-800 dark:text-slate-200">5–7 business days</strong> after the return is approved and the item is received by the seller</Bullet>
                    <Bullet>Razorpay's refund processing timelines apply for the credit to appear in your account</Bullet>
                    <Bullet>The delivery charge is refunded only if the return is due to a platform or seller error (wrong/damaged item)</Bullet>
                  </ul>
                </Section>

                <Section id="cod-orders" title="3. Cash on Delivery (COD) Orders">
                  <p>
                    For approved returns on COD orders:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Refunds cannot be made in cash — we will refund to your bank account or UPI ID</Bullet>
                    <Bullet>You will be asked to provide your bank account number / IFSC code or UPI ID when raising the return request</Bullet>
                    <Bullet>Refund will be processed within <strong className="text-slate-800 dark:text-slate-200">7–10 business days</strong> after the seller receives the returned item</Bullet>
                  </ul>
                </Section>

                <Section id="return-process" title="4. Return Process">
                  <div className="space-y-4">
                    {[
                      { step: "01", title: "Raise a request", desc: "Contact us at " + CONTACT_EMAIL + " or through the order page within 7 days of delivery. Include your order ID and clear photos/video of the issue." },
                      { step: "02", title: "Review & approval", desc: "Our team will review your request within 2 business days. We may contact the seller for their input." },
                      { step: "03", title: "Return shipping", desc: "If approved, you will receive instructions to return the item. Return shipping costs are covered by the seller if the return is due to their error." },
                      { step: "04", title: "Refund processed", desc: "Once the seller confirms receipt of the returned item, we process the refund to your original payment method." },
                    ].map((s) => (
                      <div key={s.step} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 font-heading text-sm font-bold text-white">
                          {s.step}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section id="eligible-items" title="5. Eligible & Ineligible Items">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <p className="mb-2 font-semibold text-emerald-800 dark:text-emerald-300">✅ Eligible for Return</p>
                      <ul className="space-y-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                        {[
                          "Items in original packaging",
                          "Unused / unworn products",
                          "Products with tags intact",
                          "Electronics in sealed condition",
                          "Damaged or defective items (photos required)",
                          "Wrong item delivered",
                        ].map((i) => <li key={i} className="flex gap-2"><span>•</span>{i}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                      <p className="mb-2 font-semibold text-rose-800 dark:text-rose-300">❌ Not Eligible for Return</p>
                      <ul className="space-y-1.5 text-sm text-rose-700 dark:text-rose-400">
                        {[
                          "Perishable / consumable goods",
                          "Personalised or custom-made items",
                          "Intimate apparel and hygiene products",
                          "Digital products or downloads",
                          "Items damaged due to buyer misuse",
                          "Items returned after 7 days of delivery",
                        ].map((i) => <li key={i} className="flex gap-2"><span>•</span>{i}</li>)}
                      </ul>
                    </div>
                  </div>
                </Section>

                <Section id="refund-timeline" title="6. Refund Timeline">
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Payment Method</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Refund Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {[
                          ["UPI / Wallets", "3–5 business days"],
                          ["Debit / Credit Card", "5–7 business days"],
                          ["Net Banking", "5–7 business days"],
                          ["COD (bank transfer)", "7–10 business days"],
                          ["EMI (Card)", "Subject to bank policy"],
                        ].map(([method, time]) => (
                          <tr key={method} className="bg-white dark:bg-slate-900">
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{method}</td>
                            <td className="px-4 py-3 font-semibold text-orange-600 dark:text-orange-400">{time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="pt-2 text-sm">
                    These timelines start from the date the refund is initiated by {PLATFORM_NAME}, not from the date you raised the request.
                  </p>
                </Section>

                <Section id="damaged-items" title="7. Damaged or Wrong Items">
                  <p>
                    If you receive a damaged, defective, or incorrect item, we prioritise a speedy resolution:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Take clear photos or a short video of the item as received, including the packaging</Bullet>
                    <Bullet>Email us at {CONTACT_EMAIL} with your Order ID and the evidence within <strong className="text-slate-800 dark:text-slate-200">48 hours</strong> of delivery</Bullet>
                    <Bullet>We will arrange a replacement or full refund at no cost to you, including return shipping</Bullet>
                    <Bullet>Replacement availability depends on the seller's stock</Bullet>
                  </ul>
                </Section>

                <Section id="seller-responsibility" title="8. Seller Responsibility">
                  <p>
                    Since each seller on {PLATFORM_NAME} operates independently:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Sellers are primarily responsible for product quality, accurate descriptions, and timely fulfilment</Bullet>
                    <Bullet>Refund costs for seller errors (wrong item, damage in transit due to poor packaging) are borne by the seller</Bullet>
                    <Bullet>Sellers who repeatedly cause refund issues may have their stores suspended</Bullet>
                    <Bullet>In the event a seller is unresponsive, {PLATFORM_NAME} will step in to resolve the issue directly with the buyer</Bullet>
                  </ul>
                </Section>

                <Section id="platform-fees" title="9. Platform Fees on Refunds">
                  <ul className="space-y-2 pl-1">
                    <Bullet>For full refunds, the platform commission collected is also refunded to the buyer</Bullet>
                    <Bullet>Razorpay payment gateway charges may not be refunded in all cases, per Razorpay's refund policy</Bullet>
                    <Bullet>Partial refunds are handled on a case-by-case basis</Bullet>
                  </ul>
                </Section>

                <Section id="disputes" title="10. Disputes">
                  <p>
                    If you are not satisfied with the outcome of your return request, you may escalate by:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <Bullet>Emailing our support team at {CONTACT_EMAIL} with "ESCALATION" in the subject line</Bullet>
                    <Bullet>Our team will conduct a secondary review within 5 business days</Bullet>
                    <Bullet>If unresolved, you may pursue resolution through your payment provider or consumer court</Bullet>
                  </ul>
                  <p className="pt-2">
                    We are committed to fair outcomes. We take every dispute seriously and will always
                    try to resolve issues in good faith.
                  </p>
                </Section>

                <Section id="contact" title="11. Contact Us">
                  <p>To raise a return or refund request, or for any questions about this policy:</p>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{PLATFORM_NAME} Support</p>
                    <p className="mt-1 text-sm">
                      Email:{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-orange-600 hover:underline dark:text-orange-400">
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <p className="mt-1 text-sm">Website: <a href={PLATFORM_URL} className="font-medium text-orange-600 hover:underline dark:text-orange-400">{PLATFORM_URL}</a></p>
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                      💡 Always include your Order ID when contacting us. This helps us resolve your issue faster.
                    </p>
                  </div>
                </Section>

              </div>
            </div>

            {/* Footer nav */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <Link to="/terms" className="hover:text-orange-600 dark:hover:text-orange-400">Terms of Use</Link>
              <span>·</span>
              <Link to="/refund-policy" className="font-semibold text-orange-600 dark:text-orange-400">Refund Policy</Link>
              <span>·</span>
              <Link to="/privacy-policy" className="hover:text-orange-600 dark:hover:text-orange-400">Privacy Policy</Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
