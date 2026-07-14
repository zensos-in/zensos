import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import storefront from "../assets/Storefront.png";
import registerYourStore from "../assets/Register Your Store.png";
import addProductsImage from "../assets/Add Products & Product Catelog image.png";
import valueAddedServicesImage from "../assets/Value-added-services1.jpg";
import orders from "../assets/orders.png";

// ─── Intersection observer hook for scroll animations ───────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated counter ───────────────────────────────────────────────────────
// function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
//   const [count, setCount] = useState(0);
//   const { ref, inView } = useInView(0.5);
//   useEffect(() => {
//     if (!inView) return;
//     let start = 0;
//     const duration = 1800;
//     const step = Math.ceil(target / (duration / 16));
//     const timer = setInterval(() => {
//       start = Math.min(start + step, target);
//       setCount(start);
//       if (start >= target) clearInterval(timer);
//     }, 16);
//     return () => clearInterval(timer);
//   }, [inView, target]);
//   return (
//     <div ref={ref} className="text-5xl font-black text-orange-500 tabular-nums">
//       {prefix}{count}{suffix}
//     </div>
//   );
// }

// ─── Main Landing Page ───────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // const [email, setEmail] = useState("");
  // const [subscribed, setSubscribed] = useState(false);

  const featuresSection = useInView();
  const howSection = useInView();
  const comparisonSection = useInView();
  const upcomingSection = useInView();
  // const statsSection = useInView();
  const communitySection = useInView();
  const pricingSection = useInView();
  const faqSection = useInView();
  const ctaSection = useInView();

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // const handleSubscribe = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (email) { setSubscribed(true); setEmail(""); }
  // };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(135deg,#f9fcff 0%,#fff7f0 100%)" }}>

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,117,31,0.12)" : "none",
          boxShadow: scrolled ? "0 4px 24px rgba(11,24,63,0.08)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Logo — white version on dark hero, dark version on scrolled white navbar */}
          <button onClick={() => scrollTo("hero")} className="focus:outline-none">
            {scrolled ? (
              <img
                src="/zensos-logo.png"
                alt="ZENSOS"
                className="h-11 w-auto object-contain"
                style={{ maxWidth: "9.5rem" }}
              />
            ) : (
              <img
                src="/ZENSOS Final Version (2).png"
                alt="ZENSOS"
                className="h-11 w-auto object-contain"
                style={{ maxWidth: "9.5rem" }}
              />
            )}
          </button>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {[["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Value Added Services", "value-added-services"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-semibold transition-colors hover:text-orange-500"
                style={{ color: scrolled ? "#1e293b" : "#fff", textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.3)" }}>
                {label}
              </button>
            ))}
            <Link
              to="/faq"
              className="text-sm font-semibold transition-colors hover:text-orange-500"
              style={{ color: scrolled ? "#1e293b" : "#fff", textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.3)" }}
            >
              FAQ
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-80 md:block"
              style={{ color: scrolled ? "#0b183f" : "#fff", textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.3)" }}>
              Sign In
            </Link>
            <Link to="/login?tab=register"
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:opacity-90 active:scale-100"
              style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
              Sign Up →
            </Link>
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="ml-1 flex md:hidden flex-col gap-1.5 p-1">
              <span className={`block h-0.5 w-5 rounded transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} style={{ background: scrolled ? "#0b183f" : "#fff" }} />
              <span className={`block h-0.5 w-5 rounded transition-all ${menuOpen ? "opacity-0" : ""}`} style={{ background: scrolled ? "#0b183f" : "#fff" }} />
              <span className={`block h-0.5 w-5 rounded transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} style={{ background: scrolled ? "#0b183f" : "#fff" }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t px-5 pb-5 pt-3 md:hidden" style={{ background: "rgba(255,255,255,0.97)", borderColor: "rgba(255,117,31,0.15)" }}>
            {[["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Value Added Services", "value-added-services"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full py-3 text-left text-sm font-semibold text-slate-700 hover:text-orange-500">
                {label}
              </button>
            ))}
            <Link to="/faq" className="block w-full py-3 text-left text-sm font-semibold text-slate-700 hover:text-orange-500">
              FAQ
            </Link>
            <Link to="/login" className="mt-2 block rounded-xl py-2.5 text-center text-sm font-bold" style={{ color: "#ff751f" }}>
              Sign In
            </Link>
            <Link to="/login?tab=register" className="mt-1 block rounded-xl py-3 text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
              Sign Up →
            </Link>
          </div>
        )}
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section id="hero" className="relative flex min-h-screen items-center overflow-hidden pt-20"
        style={{ background: "linear-gradient(145deg,#0b183f 0%,#0f2157 45%,#1a1060 100%)" }}>

        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl animate-pulse" style={{ background: "radial-gradient(circle,#ff751f,transparent 70%)", animationDuration: "4s" }} />
          <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)", animationDuration: "6s" }} />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: "radial-gradient(circle,#ff751f,transparent 70%)", animationDuration: "5s" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:py-24">
          {/* Left: Text */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.18)", color: "#ff9a5c", border: "1px solid rgba(255,117,31,0.3)" }}>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
              Your Next-Level Online Store
            </div>

            <h1 className="mb-6 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Get Your<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#ff751f,#ffb347)" }}>
                Online Store
              </span>
              <br />
              <span className="text-slate-300">up &amp; running in<br className="lg:hidden" /> under 10 minutes!</span>
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-slate-400 sm:text-xl lg:max-w-xl">
              Super-easy, plug-n-play e-commerce platform <span className="lg:block">with <strong className="text-orange-400">0% commission</strong></span>
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <button onClick={() => navigate("/login?tab=register")}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-orange-500/40 sm:w-auto"
                style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)", boxShadow: "0 8px 32px rgba(255,117,31,0.45)" }}>
                Get Started
                <svg className="transition-transform group-hover:translate-x-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => scrollTo("how-it-works")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
                style={{ borderColor: "rgba(255,255,255,0.25)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                See How It Works
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
              {[["💸", "Zero Commission"], ["👑", "100% Ownership"], ["🛡️", "Secured Payment"]].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <span>{icon}</span>{text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero image */}
          <div className="lg:col-span-6 relative flex items-center justify-center w-full">
            <div className="relative">
              <img src={storefront} alt="ZENSOS Storefront" className="relative z-10 w-full lg:w-auto max-w-4xl lg:h-[550px] 3xl -translate-y-6 lg:-translate-y-12" />
              {/* Floating stat cards (Commented out)
              <div className="absolute -left-6 top-8 z-20 hidden rounded-2xl p-4 shadow-2xl sm:block"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <p className="text-xs text-slate-300 font-medium">Today's Revenue</p>
                <p className="text-2xl font-black text-white">₹48,290</p>
                <p className="text-xs text-green-400 font-semibold mt-0.5">↑ 24% vs yesterday</p>
              </div>
              <div className="absolute -right-4 bottom-12 z-20 hidden rounded-2xl p-4 shadow-2xl sm:block"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <p className="text-xs text-slate-300 font-medium">New Orders</p>
                <p className="text-2xl font-black text-white">142</p>
                <p className="text-xs text-orange-400 font-semibold mt-0.5">⚡ Live updates</p>
              </div>
              */}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="h-16 w-full sm:h-20" fill="none">
            <path d="M0,80 C360,0 1080,80 1440,0 L1440,80 Z" fill="#fff7f0" />
          </svg>
        </div>
      </section>

      {/* ════════════════════ FEATURE STRIP ════════════════════ */}
      <section id="features" className="py-10 sm:py-14" style={{ background: "#fff7f0" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={featuresSection.ref}
            className={`text-center mb-8 transition-all duration-700 ${featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.18)", color: "#ff751f", border: "1px solid rgba(255,117,31,0.3)" }}>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
              Why ZENSOS
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Everything You Need to <span className="lg:block"><span style={{ color: "#ff751f" }}>Start & Scale</span> Your Online Store</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              A high-performance selling platform built for modern entrepreneurs. No middlemen, no hidden fees. Keep 100% of what you earn.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "💰", title: "Zero Commission", desc: "Keep 100% of every sale. We never take a cut from your hard-earned revenue.", color: "#ff751f" },
              { icon: "⚡", title: "Direct Payments", desc: "Don't have to worry about a payment gateway. We've got you covered.", color: "#6366f1" },
              { icon: "🛒", title: "Exclusive Storefront", desc: "Get a dedicated storefront exclusively for your business in under 10 minutes.", color: "#10b981" },
              { icon: "📲", title: "Mobile First", desc: "Your store looks stunning on every device — phones, tablets, and desktops.", color: "#f59e0b" },
              { icon: "🔐", title: "Secure Payments", desc: "Bank-grade encryption and multiple payment gateways your customers trust.", color: "#ef4444" },
              { icon: "📊", title: "Real-time Insights", desc: "Monitor sales, visitors, revenue, and top-selling products with a powerful dashboard.", color: "#8b5cf6" },
            ].map(({ icon, title, desc, color }, i) => (
              <div key={title}
                className={`group rounded-2xl p-7 transition-all duration-500 hover:-translate-y-1 cursor-default ${featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(255,117,31,0.1)",
                  boxShadow: "0 4px 18px rgba(255,117,31,0.15), 0 1px 4px rgba(0,0,0,0.06)",
                  transitionDelay: `${i * 80}ms`,
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(255,117,31,0.28), 0 2px 8px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(255,117,31,0.15), 0 1px 4px rgba(0,0,0,0.06)")}>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-110"
                  style={{ background: `${color}18` }}>
                  {icon}
                </div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: "#0b183f" }}>{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS ════════════════════ */}
      <section id="how-it-works" className="py-20 sm:py-16" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={howSection.ref}
            className={`text-center mb-8 transition-all duration-700 ${howSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.18)", color: "#ff751f", border: "1px solid rgba(255,117,31,0.3)" }}>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
              How It Works
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Up & Running in <br className="sm:hidden" /><span style={{ color: "#ff751f" }}>3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Image */}
            <div className={`order-2 lg:order-1 lg:col-span-7 transition-all duration-700 delay-100 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              {/* IMAGE LOCATION: Custom image loaded */}
              <img src={registerYourStore} alt="Register Your Store on ZENSOS" className="w-full" />
            </div>

            {/* Right Column: Steps list */}
            <div className={`order-1 lg:order-2 lg:col-span-5 space-y-5 transition-all duration-500 delay-200 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl text-white text-lg sm:text-xl font-black shadow-[0_4px_12px_rgba(255,117,31,0.25)]"
                  style={{ background: "#ff751f" }}>
                  01
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#0b183f" }}>
                  Create Your Store
                </h3>
              </div>

              {[
                { text: "Register with your basic details", color: "#ff751f" },
                { text: "Upload ID proof and address proof for KYC", color: "#ff751f" },
                { text: "Set up your store with a business logo and banners", color: "#ff751f" },
                { text: "Update Contact Information", color: "#ff751f" },
              ].map(({ text }, i) => (
                <div key={i} className="flex items-start gap-3.5 group">
                  <div className="w-10 sm:w-12 shrink-0 flex justify-center">
                    <div className="shrink-0 flex h-5 w-5 sm:h-[22px] sm:w-[22px] items-center justify-center rounded-full transition-transform group-hover:scale-110 mt-1"
                      style={{ background: "#ffffff", border: "1.5px solid #ff751f" }}>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="#ff751f" strokeWidth="3.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base sm:text-lg font-bold text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Second Row: Text Left, Image Right */}
          <div className="mt-12 lg:mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Steps list */}
            <div className={`lg:col-span-5 space-y-5 lg:order-1 transition-all duration-500 delay-200 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl text-white text-lg sm:text-xl font-black shadow-[0_4px_12px_rgba(255,117,31,0.25)]"
                  style={{ background: "#ff751f" }}>
                  02
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#0b183f" }}>
                  Add Your Products
                </h3>
              </div>

              {[
                { text: "Add products with images, description and additional notes", color: "#ff751f" },
                { text: "Assign product category and manage your product catalog", color: "#ff751f" },
                { text: "Options to have multiple variants of the same product", color: "#ff751f" },
                { text: "Highlight recommended products for your customers", color: "#ff751f" },
              ].map(({ text }, i) => (
                <div key={i} className="flex items-start gap-3.5 group">
                  <div className="w-10 sm:w-12 shrink-0 flex justify-center">
                    <div className="shrink-0 flex h-5 w-5 sm:h-[22px] sm:w-[22px] items-center justify-center rounded-full transition-transform group-hover:scale-110 mt-1"
                      style={{ background: "#ffffff", border: "1.5px solid #ff751f" }}>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="#ff751f" strokeWidth="3.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 pr-0 sm:pr-16">
                    <p className="text-base sm:text-lg font-bold text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Image */}
            <div className={`lg:col-span-7 lg:order-2 transition-all duration-700 delay-100 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
              {/* IMAGE LOCATION: Custom image loaded */}
              <img src={addProductsImage} alt="Add Your Products on ZENSOS" className="w-full" />
            </div>
          </div>

          {/* Third Row: Image Left, Text Right */}
          <div className="mt-12 lg:mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Image */}
            <div className={`order-2 lg:order-1 lg:col-span-7 transition-all duration-700 delay-100 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              {/* IMAGE LOCATION: Custom image loaded */}
              <img src={orders} alt="your order details" className="w-full" />
            </div>

            {/* Right Column: Steps list */}
            <div className={`order-1 lg:order-2 lg:col-span-5 space-y-5 transition-all duration-500 delay-200 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl text-white text-lg sm:text-xl font-black shadow-[0_4px_12px_rgba(255,117,31,0.25)]"
                  style={{ background: "#ff751f" }}>
                  03
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#0b183f" }}>
                  Publish Your Store<br className="sm:hidden" /> & Get Orders
                </h3>
              </div>

              {[
                { text: "Set up delivery charges and payment methods", color: "#ff751f" },
                { text: "Set up your store policies", color: "#ff751f" },
                { text: "Manage orders and track your sales", color: "#ff751f" },
                { text: "Add Social links for customers to stay connected", color: "#ff751f" },
                { text: "Reports and analytics to measure your business performance", color: "#ff751f" },
              ].map(({ text }, i) => (
                <div key={i} className="flex items-start gap-3.5 group">
                  <div className="w-10 sm:w-12 shrink-0 flex justify-center">
                    <div className="shrink-0 flex h-5 w-5 sm:h-[22px] sm:w-[22px] items-center justify-center rounded-full transition-transform group-hover:scale-110 mt-1"
                      style={{ background: "#ffffff", border: "1.5px solid #ff751f" }}>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="#ff751f" strokeWidth="3.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base sm:text-lg font-bold text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ OTHER PLATFORM VS ZENSOS ════════════════════ */}
      <section id="comparison" className="py-20 sm:py-16" style={{ background: "#fff7f0" }}>
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div ref={comparisonSection.ref}
            className={`text-center mb-10 transition-all duration-700 ${comparisonSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.18)", color: "#ff9a5c", border: "1px solid rgba(255,117,31,0.3)" }}>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
              The ZENSOS Advantages
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Other Platforms vs <span style={{ color: "#ff751f" }}>ZENSOS</span>
            </h2>
          </div>

          <div className={`py-5 sm:py-12 overflow-hidden transition-all duration-700 delay-100 ${comparisonSection.inView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            style={{
              background: "#0b183f",
              borderRadius: "24px",
              boxShadow: "0 20px 45px rgba(11,24,63,0.25)",
            }}>
            {/* Comparison table with horizontal scroll support on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="pb-5 pl-5 sm:pl-12 pr-6 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-teal-400 w-1/3">Feature</th>
                    <th className="pb-5 pr-10 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-400 w-1/3">Other Platforms</th>
                    <th className="pb-5 pr-5 sm:pr-12 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-orange-500 w-1/3">ZENSOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[
                    { feature: "Transaction Fees", other: "Heavy commissions (5% – 35% per order)", zensos: "0% Commission (Keep 100% of your earnings)" },
                    { feature: "Payout Timeline", other: "Delayed settlements (2 – 28 business days)", zensos: "Instant Payouts (Direct-to-bank payments)" },
                    { feature: "Store Customization", other: "Rigid, cookie-cutter templates", zensos: "Flexible Banner Listing Services" },
                    { feature: "Product Merchandising", other: "Generic, uninspired product catalogs", zensos: "Smart Showcases with Recommended Sections" },
                    { feature: "Product Configurations", other: "Complex or limited variant setups", zensos: "Seamless Multi-Variant options enabled" },
                    { feature: "Setup & Launch Time", other: "Hours or days of complex configuration", zensos: "Plug-and-Play setup in under 10 minutes" },
                    { feature: "Mobile Experience", other: "Inconsistent responsiveness on phones", zensos: "Mobile-First Design optimized for every screen" },
                    { feature: "Business Insights", other: "Delayed or basic data reporting", zensos: "Real-Time Analytics & performance dashboard" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-5 pl-5 sm:pl-12 pr-6 font-bold text-white text-xs sm:text-sm md:text-base">{row.feature}</td>
                      <td className="py-5 pr-10 text-slate-300 text-xs sm:text-sm md:text-base">{row.other}</td>
                      <td className="py-5 pr-5 sm:pr-12 font-bold text-orange-300 text-xs sm:text-sm md:text-base">{row.zensos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ UPCOMING FEATURES ════════════════════ */}
      <section id="upcoming" className="py-10 sm:py-14" style={{ background: "#fdfbf7" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={upcomingSection.ref}
            className={`text-center mb-10 transition-all duration-700 ${upcomingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f", border: "1px solid rgba(255,117,31,0.25)" }}>
              <span className="inline-block h-2 w-2 rounded-full bg-[#ff751f]" />
              Coming Soon
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-[#0b183f]">
              Upcoming <span style={{ color: "#ff751f" }}>Features</span>
            </h2>
            {/* <p className="mt-4 text-lg text-slate-500 max-w-3xl mx-auto">
              We are constantly building tools to help Shankara Online Solutions and your brand grow. Here are the plugins and integrations coming next.
            </p> */}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Delivery Partner Integration",
                logo: (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-[#E31E24] text-white shrink-0">
                    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {/* Back Wheel */}
                      <circle cx="6" cy="18" r="2.5" />
                      {/* Front Wheel */}
                      <circle cx="18" cy="18" r="2.5" />
                      {/* Scooter Body & Floorboard */}
                      <path d="M6 18h4.5a1 1 0 001-1v-2.5h3.5l1.5 3.5" />
                      {/* Steering Column & Handlebars */}
                      <path d="M16.5 14l1.5-6h-2.5" />
                      {/* Delivery Box */}
                      <rect x="2.5" y="9.5" width="4.5" height="4.5" rx="0.5" fill="white" stroke="white" strokeWidth="1" />
                      {/* Delivery Rider */}
                      {/* Helmet / Head */}
                      <circle cx="12" cy="6.5" r="1.5" fill="white" />
                      {/* Body leaning forward */}
                      <path d="M9.5 13c.3-2.5 1.2-4.5 2.5-5l3 2" />
                      {/* Rider Leg */}
                      <path d="M12 12.5v3.5" />
                      {/* Motion / Speed Lines */}
                      <path d="M2 5.5h-1" strokeWidth="1.5" />
                      <path d="M1.5 7.5h-1.5" strokeWidth="1.5" />
                    </svg>
                  </div>
                )
              },
              {
                title: "Affiliate Program Integration",
                desc: "Create custom referral links and recruit advocates.",
                logo: (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-[#6366f1] shrink-0 border border-indigo-100/50">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                )
              },
              {
                title: "Trust Badges",
                logo: (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-[#0b183f] shrink-0 border border-slate-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#0b183f] flex flex-col items-center justify-center p-1">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      <span className="text-[5px] font-black text-white uppercase tracking-widest leading-none mt-0.5" style={{ fontSize: "5px" }}>Trusted</span>
                    </div>
                  </div>
                )
              },
              {
                title: "Instagram Reels Integration",
                logo: (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                )
              },
              {
                title: "WhatsApp Business API Integration",
                logo: (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-[#25d366] shrink-0">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                )
              },
              {
                title: "Google Reviews",
                logo: (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shrink-0">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                )
              }
            ].map(({ title, logo }, idx) => (
              <div key={title}
                className={`group border border-slate-200/80 rounded-3xl p-5 transition-all duration-300 hover:scale-[1.03] active:scale-100 flex items-center gap-4 ${upcomingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  background: "#ffffff",
                  boxShadow: "0 10px 30px rgba(11, 24, 63, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
                  transitionDelay: `${idx * 100}ms`
                }}>
                {logo}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0b183f] tracking-tight leading-tight mb-1">
                    {title}
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff751f] px-2 py-0.5 rounded-md"
                    style={{
                      background: "rgba(255, 117, 31, 0.08)",
                      border: "1px solid rgba(255, 117, 31, 0.18)"
                    }}>
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS ════════════════════ */}
      {/* <section className="py-20 sm:py-24" style={{ background: "linear-gradient(135deg,#0b183f 0%,#0f2157 100%)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={statsSection.ref}
            className={`text-center mb-14 transition-all duration-700 ${statsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Numbers That <span style={{ color: "#ff751f" }}>Speak</span>
            </h2>
            <p className="mt-3 text-lg text-slate-400">Join thousands of sellers already thriving on ZENSOS</p>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { target: 0, suffix: "%", label: "Commission", desc: "We charge zero — you keep everything" },
              { target: 100, suffix: "%", label: "Direct Payments", desc: "Money goes straight to your account" },
              { target: 200, suffix: "+", label: "Active Sellers", desc: "Growing community of entrepreneurs" },
              { target: 10000, suffix: "+", prefix: "₹", label: "Orders Processed", desc: "And counting every single day" },
            ].map(({ target, suffix, prefix, label, desc }) => (
              <div key={label}
                className={`rounded-2xl p-6 text-center transition-all duration-500 ${statsSection.inView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Counter target={target} suffix={suffix} prefix={prefix} />
                <p className="mt-2 text-base font-bold text-white">{label}</p>
                <p className="mt-1 text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ════════════════════ PRICING ════════════════════ */}
      <section id="pricing" className="py-12 sm:py-16" style={{ background: "#fff7f0" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={pricingSection.ref}
            className={`text-center mb-14 transition-all duration-700 ${pricingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.18)", color: "#ff751f", border: "1px solid rgba(255,117,31,0.3)" }}>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
              Pricing
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Simple, Transparent<br /><span style={{ color: "#ff751f" }}>Pricing</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-3xl mx-auto">No hidden fees. No commission. Pay only for the plan that fits your business.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                subtitle: "For sellers just getting started",
                price: "₹1,299",
                strikePrice: "₹999",
                color: "#6366f1",
                features: [
                  "List up to 10 products",
                  "Up to 2 store banners",
                  "Up to 5 variants per product",
                  "Printable PDF of order copy",
                  "Payment Gateway Integration",
                  "Settlement in T+2 days",
                  "Free ZENSOS subdomain",
                  "Real-time Store Analytics",
                  "Email Support",
                  "Trust Badge",
                ],
                cta: "Get Started", popular: false,
              },
              {
                name: "Growth",
                subtitle: "For sellers ready to scale",
                price: "₹1,799",
                strikePrice: "₹1,499",
                color: "#ff751f",
                features: [
                  "List up to 18 products",
                  "Up to 3 store banners",
                  "Up to 8 variants per product",
                  "Printable PDF of order copy",
                  "Payment Gateway Integration",
                  "Settlement in T+2 days",
                  "Free ZENSOS subdomain",
                  "Real-time Store Analytics",
                  "Email and Call Support",
                  "Trust Badge",
                  "Delivery Partner Integration",
                  "Instagram Reels Integration",
                  "Coupon Code Integration",
                ],
                cta: "Start Growing", popular: true,
              },
              {
                name: "Business",
                subtitle: "For established sellers",
                price: "₹2,799",
                strikePrice: "₹2,499",
                color: "#10b981",
                features: [
                  "List up to 30 products",
                  "Up to 5 store banners",
                  "Up to 10 variants per product",
                  "Printable PDF of order copy",
                  "Payment Gateway Integration",
                  "Settlement in T+2 days",
                  "Free ZENSOS subdomain",
                  "Real-time Store Analytics",
                  "Priority Support on Call",
                  "Trust Badge",
                  "Delivery Partner Integration",
                  "Instagram Reels Integration",
                  "Coupon Code Integration",
                  "Affiliate Program Integration",
                  "Google Reviews Integration",
                ],
                cta: "Go Business", popular: false,
              },
            ].map(({ name, subtitle, price, strikePrice, color, features, cta, popular }, i) => (
              <div key={name}
                className={`relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${pricingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${popular ? "ring-2 shadow-xl" : "shadow-md"}`}
                style={{
                  background: popular ? `linear-gradient(145deg,#0b183f,#0f2157)` : "rgba(255,255,255,0.9)",
                  border: popular ? `2px solid ${color}` : "1px solid rgba(255,117,31,0.1)",
                  transitionDelay: `${i * 100}ms`,
                  ...(popular ? { boxShadow: `0 20px 60px rgba(255,117,31,0.3)` } : {}),
                }}>
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-xs font-black text-white"
                    style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
                    ✦ RECOMMENDED
                  </div>
                )}
                <div className="mb-1">
                  <p className="text-lg font-black uppercase tracking-widest" style={{ color: popular ? "#fff" : "#0b183f" }}>{name}</p>
                  <p className="text-xs font-semibold mt-0.5 mb-4" style={{ color: popular ? "rgba(255,255,255,0.55)" : "#94a3b8" }}>{subtitle}</p>
                  {/* Price */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-4xl font-black" style={{ color: popular ? "#fff" : "#0b183f" }}>{strikePrice}</span>
                    <span className="text-base font-semibold line-through opacity-50" style={{ color: popular ? "#fff" : "#0b183f" }}>{price}</span>
                    <span className="text-xs font-semibold" style={{ color: popular ? "rgba(255,255,255,0.5)" : "#94a3b8" }}>+ 18% GST</span>
                  </div>
                  {/* Handling charge note */}
                  <p className="mt-2 mb-5 text-xs font-semibold rounded-lg px-3 py-1.5 inline-block"
                    style={{ background: popular ? "rgba(255,117,31,0.18)" : "rgba(255,117,31,0.08)", color: popular ? "#ff9a5c" : "#ff751f" }}>
                    +1% per transaction · Platform Payment Handling Charges
                  </p>
                </div>
                <ul className="mb-8 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: popular ? "rgba(255,255,255,0.8)" : "#475569" }}>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: color }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate("/login?tab=register")}
                  className={`w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:scale-105 ${popular ? "text-white" : ""}`}
                  style={popular ? { background: `linear-gradient(135deg,#ff751f,#ff4500)`, boxShadow: "0 8px 20px rgba(255,117,31,0.4)" } : { background: `${color}18`, color }}>
                  {cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ Value Added Services ════════════════════ */}
      <section id="value-added-services" className="relative pt-24 pb-20 sm:pt-32 sm:pb-24 overflow-hidden"
        style={{ background: "linear-gradient(145deg,#0b183f 0%,#0f2157 45%,#1a1060 100%)" }}>

        {/* Wave divider at top */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="h-16 w-full sm:h-20 rotate-180" fill="none">
            <path d="M0,80 C360,0 1080,80 1440,0 L1440,80 Z" fill="#fff7f0" />
          </svg>
        </div>

        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl animate-pulse" style={{ background: "radial-gradient(circle,#ff751f,transparent 70%)", animationDuration: "4s" }} />
          <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)", animationDuration: "6s" }} />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: "radial-gradient(circle,#ff751f,transparent 70%)", animationDuration: "5s" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 z-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div ref={communitySection.ref}
              className={`transition-all duration-700 ${communitySection.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(255,117,31,0.18)", color: "#ff9a5c", border: "1px solid rgba(255,117,31,0.3)" }}>
                <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
                Value Added Services
              </div>
              <h2 className="mb-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                More Than a Platform.<br /><span style={{ color: "#ff751f" }}>Your Growth Partner.</span>
              </h2>
              <p className="mb-7 text-lg leading-relaxed text-slate-400">
                Take your online store to the next level with our value added services. Beyond our e-commerce tool, we offer services tailored to help your brand grow online. Let our experts handle the heavy lifting while you focus on selling.
              </p>
              <div className="mb-8 grid grid-cols-2 gap-4">
                {[
                  { icon: "🎨", text: "Store Design Support" },
                  { icon: "📣", text: "Digital Marketing" },
                  { icon: "📦", text: "Product Packaging Design" },
                  { icon: "📈", text: "Growth Strategies" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-semibold text-slate-200">{text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/login?tab=register")}
                className="rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
                Let's Build Together →
              </button>
            </div>
            <div className={`transition-all duration-700 delay-200 ${communitySection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20" style={{ background: "linear-gradient(135deg,#ff751f,#6366f1)" }} />
                <img src={valueAddedServicesImage} alt="ZENSOS value added services" className="relative w-full rounded-3xl shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FAQ SECTION ════════════════════ */}
      <section id="faq" className="py-20 sm:py-20" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div ref={faqSection.ref}
            className={`text-center mb-10 transition-all duration-700 ${faqSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f", border: "1px solid rgba(255,117,31,0.25)" }}>
              <span className="inline-block h-2 w-2 rounded-full bg-[#ff751f]" />
              More Info
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-[#0b183f]">
              Frequently Asked <span style={{ color: "#ff751f" }}>Questions</span>
            </h2>
          </div>

          {/* Mosaic pill cards */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { id: "getting-started", label: "Getting Started"                   },
              { id: "payments",        label: "Payments & Settlements"            },
              { id: "pricing",         label: "Pricing & Charges"                 },
              { id: "store-growth",    label: "Store, Products & Growth"          },
              { id: "delivery",        label: "Inventory, Delivery & Fulfillment" },
              { id: "support",         label: "Support & Security"                },
            ].map((cat) => (
              <Link
                key={cat.id}
                to={`/faq#${cat.id}`}
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                style={{ boxShadow: "0 4px 20px rgba(11,24,63,0.05)" }}
              >
                <span className="font-extrabold text-[#0b183f] text-sm sm:text-base">{cat.label}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 group-hover:bg-orange-50" style={{ color: "#ff751f" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA BANNER ════════════════════ */}
      <section className="py-20 sm:py-20" style={{ background: "linear-gradient(135deg,#0b183f 0%,#1a1060 100%)" }}>
        <div ref={ctaSection.ref} className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className={`transition-all duration-700 ${ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(255,117,31,0.18)", color: "#ff9a5c", border: "1px solid rgba(255,117,31,0.3)" }}>
                <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
                Get Your Online Store Up <br className="sm:hidden" />&amp; Running with ZENSOS
              </div>
            </div>
            <h2 className="mb-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Zero-effort<br className="sm:hidden" /> Ecosystem for<br /><span style={{ color: "#ff751f" }}>Next-level Selling</span>
            </h2>
            <p className="mb-5 text-lg text-slate-400">
              by Shankara Online Solutions
            </p>

            {/* {subscribed ? (
              <div className="mx-auto max-w-md rounded-2xl p-6" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <p className="text-lg font-bold text-green-400">🎉 You're on the list! We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                />
                <button type="submit"
                  className="rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
                  Subscribe
                </button>
              </form>
            )} */}

            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button onClick={() => navigate("/login?tab=register")}
                className="rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)", boxShadow: "0 8px 32px rgba(255,117,31,0.45)" }}>
                Start Selling →
              </button>
              <button onClick={() => scrollTo("pricing")}
                className="rounded-2xl border px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.25)" }}>
                Check Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

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
              {/* <div className="flex gap-3">
                {[
                  { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                  { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
                  { label: "Instagram", path: "M 8 2 L 16 2 A 6 6 0 0 1 22 8 L 22 16 A 6 6 0 0 1 16 22 L 8 22 A 6 6 0 0 1 2 16 L 2 8 A 6 6 0 0 1 8 2 M 12 7 A 5 5 0 1 0 12 17 A 5 5 0 0 0 12 7 M 17.5 6.5 A 1 1 0 1 0 17.5 8.5 A 1 1 0 0 0 17.5 6.5" },
                ].map(({ label, path }) => (
                  <a key={label} href="#" aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div> */}
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-5 text-base font-extrabold uppercase tracking-widest" style={{ color: "#ff751f" }}>Product</h4>
              <ul className="space-y-1.5">
                {[["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Value Added Services", "value-added-services"]].map(([label, id]) => (
                  <li key={label}>
                    <button onClick={() => scrollTo(id)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>{label}</button>
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
                    <button onClick={() => navigate("/login?tab=register")} className="rounded-xl px-4 py-2 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100" style={{ background: "#ffffff", color: "#ff751f" }}>Sign Up</button>
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
