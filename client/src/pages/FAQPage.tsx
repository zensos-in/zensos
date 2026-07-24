import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";


type FAQItem = { q: string; a: string };
type FAQSection = { id: string; label: string; items: FAQItem[] };

const FAQ_DATA: FAQSection[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    items: [
      {
        q: "What is ZENSOS?",
        a: "ZENSOS (Zero-effort Ecosystem for Next-level Selling) is a plug-and-play online store platform built for sellers who want to sell their products online without building a website from scratch. You get a storefront, a seller dashboard to manage products and orders, real-time sales analytics, and a secure payment gateway — all in one place.",
      },
      {
        q: "Who is ZENSOS for?",
        a: "ZENSOS is built for product-based businesses - home businesses, D2C brands, drop-shipping businesses and small-to-medium sellers, wholesalers, who currently rely on WhatsApp, Instagram, or word-of-mouth to sell, and want a proper online store without technical dependencies.",
      },
      {
        q: "Is ZENSOS a marketplace? Will my products be listed alongside other sellers?",
        a: "No. ZENSOS is not a marketplace. Each seller gets their own independent storefront with a unique link where your products are never listed or mixed in with any other seller's store. You're selling on your own store, not a listing on a marketplace.",
      },
      {
        q: "Does ZENSOS market or promote my store and products for me?",
        a: "No, not by default. ZENSOS gives you the storefront and the tools (banners, recommended products, a shareable store link), but marketing and promoting your store is on you. If you'd like hands-on help growing your store, that's available as an optional value-added service at an additional cost, separate from your subscription. You may write to us on naik@shankaraonline.com to enquire about the value-added support.",
      },
      {
        q: "Do I need any coding or technical skills to set up my store?",
        a: "No. ZENSOS is designed to be zero-effort. You can set up your storefront, add products, and go live using guided steps in your seller dashboard, no coding required whatsoever.",
      },
      {
        q: "How long does it take to launch my store?",
        a: "Most sellers can set up their storefront and list their products and send it for a review in less than 10 minutes, depending on how many products they're adding and how much customization they want. Once the store is published and sent for a review, it will take up to 48 hours for us to review it manually, get back to you for any clarifications and approve your store.",
      },
      {
        q: "Can I sell any type of product on ZENSOS?",
        a: "ZENSOS supports only physical product categories. Our platform don't support sale of digital products like e-books, templates, themes, pictures, etc.",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Settlements",
    items: [
      {
        q: "How do I get paid when a customer orders from my store?",
        a: "Every pre-paid order placed on your store is paid online through our integrated payment gateway (powered by Razorpay). Customers can pay via UPI, cards, netbanking, or wallets, and the amount is settled directly to your registered bank account.",
      },
      {
        q: "When will the money reach my bank account?",
        a: "Payments are settled on a T+2 basis (Transaction + 2 days), meaning the amount for a transaction reaches your bank account within 2 business days of the order being placed.",
      },
      {
        q: "Is it safe for my customers to pay online through ZENSOS?",
        a: "Yes. All payments are processed through Razorpay, one of India's most trusted and RBI-compliant payment gateways, using bank-grade encryption. ZENSOS does not store your customers' card or banking details.",
      },
      {
        q: "What payment methods can my customers use?",
        a: "For prepaid orders, your customers can pay using UPI, debit/credit cards, net banking, and popular wallets — all through the built-in checkout.",
      },
      {
        q: "Can I choose to accept only prepaid orders, only Cash on Delivery, or both?",
        a: "Yes. From your seller dashboard, you can set your store to accept prepaid orders only, COD only, or both - whichever suits your business and delivery setup best.",
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Charges",
    items: [
      {
        q: "What does my monthly subscription fee include?",
        a: "Your subscription gives you access to your storefront, seller dashboard, product and order management, and analytics - the core tools to run your store. The additional features depends on the plan you have subscribed for.",
      },
      {
        q: "What is the handling charge on each transaction, and why is it charged?",
        a: "Every online payment gateway in India charges a processing fee to accept payments securely and this isn't unique to ZENSOS. To keep things simple, we bundle the payment gateway's routing fee, transaction fee, and applicable GST into one flat 1% platform handling charge per transaction, deducted before settlement. You don't need to calculate anything separately — the amount you see is the amount you'll receive, minus 1%.",
      },
      {
        q: "Do you charge commission on my sales?",
        a: "No. ZENSOS does not take a commission or a cut of your revenue as a marketplace would. The only charge on each order is the flat 1% handling charge, which covers secure payment processing and not a share of your business.",
      },
      {
        q: "Are there any hidden or setup fees?",
        a: "No setup fee. You pay your monthly (or quarterly or annual) subscription plus the 1% handling charge per transaction — nothing else.",
      },
      {
        q: "Can I change, upgrade, downgrade, or cancel my plan anytime?",
        a: "Yes, you can upgrade, downgrade, or cancel your plan anytime from your seller dashboard. If you're on a quarterly or yearly plan, your store stays active until the end of the period you've already paid for, but the amount already paid is non-refundable for cancellations or downgrades made mid-cycle.",
      },
    ],
  },
  {
    id: "store-growth",
    label: "Store, Products & Growth",
    items: [
      {
        q: "Can I track my sales and customers?",
        a: "Yes. Your seller dashboard gives you real-time analytics on orders, revenue, and product performance, so you always know how your store is doing.",
      },
      {
        q: "Can I use my own domain name (e.g., www.mystorename.com) instead of a ZENSOS subdomain?",
        a: "Currently, we don't support custom domain integration. Will be part of the pricing plan as and when we come up this feature.",
      },
      {
        q: "Can more than one person from my team manage the store?",
        a: "No. Currently, we don't allow more than one person in the team to manage the store.",
      },
      {
        q: "Can I customize how my storefront looks?",
        a: "Yes. You can add up to 5 store banners to showcase your brand, offers, or bestsellers, and mark specific products as \"Recommended\" so they're featured at the top of your storefront. But, you cannot change the design or the UI/UX of your store.",
      },
      {
        q: "Can I set my own privacy policy, return & refund policy, and terms of use?",
        a: "Yes. ZENSOS lets you add your own privacy policy, return & refund policy, and terms of use for your store, so your customers always know exactly what to expect when they shop with you.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Inventory Management, Delivery & Fulfillment",
    items: [
      {
        q: "Can I set my own delivery charges?",
        a: "Yes. You can set a flat delivery charge, offer Free Delivery on all orders, or offer Free Delivery only above a certain order value, whatever fits your margins.",
      },
      {
        q: "Does ZENSOS manage my inventory for me?",
        a: "No, ZENSOS doesn't currently include built-in inventory management. You'll need to track your stock levels separately and update your listings accordingly.",
      },
      {
        q: "Does ZENSOS handle shipping and delivery of my orders?",
        a: "No, delivery and logistics aren't currently managed by ZENSOS. You'll need to arrange shipping through your own courier or delivery partner. Delivery partner integrations are planned for higher-tier plans in the future.",
      },
      {
        q: "Are there other integrations coming to ZENSOS?",
        a: "Yes! We're continuously adding to the platform. Planned integrations include delivery partner connections, an affiliate partner program, Google Reviews, Instagram Reels, trust badges, coupon codes and Google Analytics, so you can keep building credibility and reach as your store grows.",
      },
    ],
  },
  {
    id: "support",
    label: "Support & Security",
    items: [
      {
        q: "What kind of support do I get if I run into an issue?",
        a: "You may email us at info@shankaraonline.com if you run into an issue with your store. We will soon introduce chat feature that will make it smoother for any quick support.",
      },
      {
        q: "Is my store and business data secure on ZENSOS?",
        a: "Yes. Your store data is hosted securely, and all payment processing is handled by Razorpay under RBI-regulated infrastructure. ZENSOS does not have access to or store sensitive payment credentials.",
      },
    ],
  },
];

function AccordionItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`border rounded-2xl transition-all duration-300 ${isOpen ? "border-orange-500/30 ring-1 ring-orange-500/10" : "border-slate-200/80 hover:border-slate-300"}`}
      style={{ background: "#ffffff", boxShadow: "0 10px 30px rgba(11,24,63,0.04), 0 1px 3px rgba(0,0,0,0.02)" }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 focus:outline-none"
      >
        <span className="text-base sm:text-lg font-extrabold text-[#0b183f]">{q}</span>
        <span
          className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? "rotate-180 bg-orange-50 text-orange-500" : "text-slate-500"}`}
          style={!isOpen ? { background: "#f8fafc" } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[600px]" : "max-h-0"}`}>
        <div className="px-4 pb-3 pt-0 border-t border-slate-100 text-sm leading-relaxed font-medium" style={{ color: "#475569" }}>
          {a}
        </div>
      </div>
    </div>
  );
}

export function FAQPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top, behavior: "smooth" });
      }, 150);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);


  const toggle = (key: string) => setOpenItem(prev => prev === key ? null : key);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Header (always-white, same scrolled style as Landing page) ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,117,31,0.12)",
          boxShadow: "0 4px 24px rgba(11,24,63,0.08)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Logo */}
          <Link to="/" className="focus:outline-none">
            <img src="/zensos-logo.png" alt="ZENSOS" className="h-11 w-auto object-contain" style={{ maxWidth: "9.5rem" }} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {([["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Value Added Services", "value-added-services"]] as [string, string][]).map(([label, id]) => (
              <a key={id} href={`/#${id}`}
                className="text-sm font-semibold text-slate-700 transition-colors hover:text-orange-500">
                {label}
              </a>
            ))}
            <Link to="/faq" className="text-sm font-semibold" style={{ color: "#ff751f" }}>
              FAQ
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-[#0b183f] transition-all hover:opacity-80 md:block">
              Sign In
            </Link>
            <Link to="/login?tab=register"
              className="whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-bold text-white transition-all hover:scale-105 hover:opacity-90 active:scale-100"
              style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
              Start for Free →
            </Link>
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="ml-1 flex md:hidden flex-col gap-1.5 p-1">
              <span className={`block h-0.5 w-5 rounded bg-[#0b183f] transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-5 rounded bg-[#0b183f] transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 rounded bg-[#0b183f] transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t px-5 pb-5 pt-3 md:hidden" style={{ background: "rgba(255,255,255,0.97)", borderColor: "rgba(255,117,31,0.15)" }}>
            {([["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Value Added Services", "value-added-services"]] as [string, string][]).map(([label, id]) => (
              <a key={id} href={`/#${id}`} onClick={() => setMenuOpen(false)} className="block w-full py-3 text-left text-sm font-semibold text-slate-700 hover:text-orange-500">
                {label}
              </a>
            ))}
            <Link to="/faq" onClick={() => setMenuOpen(false)} className="block w-full py-3 text-left text-sm font-semibold" style={{ color: "#ff751f" }}>
              FAQ
            </Link>
            <Link to="/login" className="mt-2 block rounded-xl py-2.5 text-center text-sm font-bold" style={{ color: "#ff751f" }}>
              Sign In
            </Link>
            <Link to="/login?tab=register" className="mt-1 block rounded-xl py-3 text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
              Start for Free →
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-4 pt-32 pb-14 text-center sm:pt-36 sm:pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)" }}>
            <span className="inline-block h-2 w-2 rounded-full bg-white" />
            More Info
          </div>
          <h1 className="font-heading text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            Frequently Asked <span style={{ color: "#fff3e0" }}>Questions</span>
          </h1>
          {/* Mosaic pill nav */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {[
              { id: "getting-started", label: "Getting Started"                   },
              { id: "payments",        label: "Payments & Settlements"            },
              { id: "pricing",         label: "Pricing & Charges"                 },
              { id: "store-growth",    label: "Store, Products & Growth"          },
              { id: "delivery",        label: "Inventory, Delivery & Fulfillment" },
              { id: "support",         label: "Support & Security"                },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className="group inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 backdrop-blur-sm transition-all duration-200 hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5"
              >
                <span className="font-extrabold text-white text-sm sm:text-base">{cat.label}</span>
                <span className="flex h-5 w-5 items-center justify-center" style={{ color: "#fff3e0" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 space-y-14">
        {FAQ_DATA.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-28">
            {/* Section heading — orange badge style, big */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold uppercase tracking-widest"
                style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f", border: "1px solid rgba(255,117,31,0.25)" }}
              >
                <span className="inline-block h-2 w-2 rounded-full bg-[#ff751f]" />
                {section.label}
              </div>
            </div>
            <div className="space-y-3">
              {section.items.map((item, idx) => {
                const key = `${section.id}-${idx}`;
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openItem === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="border-t py-10" style={{ background: "#0b183f", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="mx-auto max-w-7xl pl-10 pr-5 sm:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="mb-5">
                {/* White-text logo for dark footer */}
                <img
                  src="/ZENSOS Final Version (2).png"
                  alt="ZENSOS"
                  className="h-10 w-auto object-contain"
                  style={{ maxWidth: "9rem" }}
                />
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-400 lg:pr-[115px]">
                <span className="block lg:inline lg:whitespace-nowrap">Super-easy, plug-n-play</span>{" "}
                <span className="block lg:inline lg:whitespace-nowrap">e-commerce platform</span>{" "}
                <span className="block lg:inline lg:whitespace-nowrap">with 0% commission</span>
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-5 text-base font-extrabold uppercase tracking-widest" style={{ color: "#ff751f" }}>Product</h4>
              <ul className="space-y-1.5">
                {[["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Value Added Services", "value-added-services"]].map(([label, id]) => (
                  <li key={label}>
                    <a href={`/#${id}`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>{label}</a>
                  </li>
                ))}
                <li>
                  <Link to="/faq" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>FAQ</Link>
                </li>
              </ul>
            </div>

            {/* Other Links */}
            <div>
              <h4 className="mb-5 text-base font-extrabold uppercase tracking-widest" style={{ color: "#ff751f" }}>Other Links</h4>
              <ul className="space-y-1.5">
                <li><Link to="/privacy-policy" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>Privacy Policy</Link></li>
                <li><Link to="/terms" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>Terms of Use</Link></li>
                <li><Link to="/refund-policy" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>Refund Policy</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-5 text-base font-extrabold uppercase tracking-widest" style={{ color: "#ff751f" }}>Company</h4>
              <ul className="space-y-1.5">
                <li><a href="https://shankaraonline.com" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400">About Us</a></li>
                <li><Link to="/contact-us" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400">Contact Us</Link></li>
                <li className="pt-2">
                  <div className="flex gap-2">
                    <a href="mailto:naik@shankaraonline.com" className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100 inline-block" style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>Partner With Us</a>
                    <button onClick={() => navigate("/login?tab=register")} className="rounded-xl px-4 py-2 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100" style={{ background: "#ffffff", color: "#ff751f" }}>Start for Free</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t pt-5 sm:flex-row"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-sm text-slate-500 text-center sm:text-left">
              © 2026 ZENSOS. All rights reserved.{" "}
              <span className="block sm:inline">
                Powered by{" "}
                <a href="https://www.shankaraonline.com" className="text-slate-300 hover:underline">
                  Shankara Online
                </a>
                .
              </span>
            </p>
            <div className="flex gap-1.5 items-center">
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
              <span className="text-xs font-medium text-slate-500">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
