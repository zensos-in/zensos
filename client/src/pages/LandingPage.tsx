import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ZensosLogo, ZENSOS_LOGO_LIGHT } from "../components/ZensosLogo";
import heroDashboard from "../assets/hero_dashboard.png";
import howItWorks from "../assets/how_it_works.png";
import communitySellers from "../assets/community_sellers.png";

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
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return (
    <div ref={ref} className="text-5xl font-black text-orange-500 tabular-nums">
      {prefix}{count}{suffix}
    </div>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Sections for scroll animation
  const featuresSection = useInView();
  const howSection = useInView();
  const statsSection = useInView();
  const communitySection = useInView();
  const pricingSection = useInView();
  const ctaSection = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(""); }
  };

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
          {/* Logo — uses real brand asset; white-tinted version on dark hero */}
          <button onClick={() => scrollTo("hero")} className="focus:outline-none">
            {scrolled ? (
              <ZensosLogo size="lg" alt="ZENSOS" />
            ) : (
              /* White version over dark hero background */
              <img
                src={ZENSOS_LOGO_LIGHT}
                alt="ZENSOS"
                className="h-11 w-auto object-contain brightness-0 invert"
                style={{ maxWidth: "9.5rem" }}
              />
            )}
          </button>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {[["Features", "features"], ["How It Works", "how-it-works"], ["Community", "community"], ["Pricing", "pricing"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-semibold transition-colors hover:text-orange-500"
                style={{ color: scrolled ? "#1e293b" : "#fff", textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.3)" }}>
                {label}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-80 md:block"
              style={{ color: scrolled ? "#0b183f" : "#fff", textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.3)" }}>
              Sign In
            </Link>
            <Link to="/login?tab=register"
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100"
              style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
              Start Free →
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
            {[["Features", "features"], ["How It Works", "how-it-works"], ["Community", "community"], ["Pricing", "pricing"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full py-3 text-left text-sm font-semibold text-slate-700 hover:text-orange-500">
                {label}
              </button>
            ))}
            <Link to="/login" className="mt-2 block rounded-xl py-2.5 text-center text-sm font-bold" style={{ color: "#ff751f" }}>
              Sign In
            </Link>
            <Link to="/login?tab=register" className="mt-1 block rounded-xl py-3 text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
              Register Free →
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

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(255,117,31,0.18)", color: "#ff9a5c", border: "1px solid rgba(255,117,31,0.3)" }}>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: "#ff751f" }} />
              The Future of E-Commerce
            </div>

            <h1 className="mb-6 text-5xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build Your<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#ff751f,#ffb347)" }}>
                Online Store.
              </span>
              <br />
              <span className="text-slate-300">Sell Directly.</span>
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-slate-400 sm:text-xl lg:max-w-xl">
              Super-easy, plug-n-play e-commerce platform. Get paid instantly with <strong className="text-orange-400">0% commission</strong>. Setup in under 10 minutes.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <button onClick={() => navigate("/login?tab=register")}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-orange-500/40 sm:w-auto"
                style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)", boxShadow: "0 8px 32px rgba(255,117,31,0.45)" }}>
                Start Selling Free
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
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              {[["🚫", "Zero Commission"], ["⚡", "Instant Payouts"], ["🔒", "Secure Payments"]].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <span>{icon}</span>{text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero image */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-40" style={{ background: "radial-gradient(circle,#ff751f,#6366f1)" }} />
              <img src={heroDashboard} alt="ZENSOS Dashboard" className="relative z-10 w-full max-w-xl rounded-3xl shadow-2xl ring-1 ring-white/10" />
              {/* Floating stat cards */}
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
      <section id="features" className="py-20 sm:py-28" style={{ background: "#fff7f0" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={featuresSection.ref}
            className={`text-center mb-14 transition-all duration-700 ${featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-3"
              style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f" }}>Why ZENSOS</span>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Everything You Need to<br /><span style={{ color: "#ff751f" }}>Sell & Succeed</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              A high-performance selling platform built for modern entrepreneurs. No middlemen, no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🚫", title: "Zero Commission", desc: "Keep 100% of every sale. We never take a cut from your hard-earned revenue.", color: "#ff751f" },
              { icon: "⚡", title: "Instant Payouts", desc: "Money lands in your account the moment a customer pays. No waiting, no delays.", color: "#6366f1" },
              { icon: "🏪", title: "Your Own Store", desc: "Get a beautiful branded storefront with your own URL in under 10 minutes.", color: "#10b981" },
              { icon: "📱", title: "Mobile First", desc: "Your store looks stunning on every device — phones, tablets, and desktops.", color: "#f59e0b" },
              { icon: "🔒", title: "Secure Payments", desc: "Bank-grade encryption and multiple payment gateways your customers trust.", color: "#ef4444" },
              { icon: "📊", title: "Live Analytics", desc: "Real-time dashboard showing sales, visitors, and revenue with beautiful charts.", color: "#8b5cf6" },
            ].map(({ icon, title, desc, color }, i) => (
              <div key={title}
                className={`group rounded-2xl p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg cursor-default ${featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(255,117,31,0.08)",
                  transitionDelay: `${i * 80}ms`,
                }}>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-110"
                  style={{ background: `${color}18` }}>
                  {icon}
                </div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: "#0b183f" }}>{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS ════════════════════ */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={howSection.ref}
            className={`text-center mb-16 transition-all duration-700 ${howSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-3"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>How It Works</span>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Up & Selling in<br /><span style={{ color: "#ff751f" }}>3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className={`transition-all duration-700 delay-100 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <img src={howItWorks} alt="How ZENSOS works" className="w-full rounded-3xl shadow-xl" />
            </div>
            <div className={`space-y-8 transition-all duration-700 delay-200 ${howSection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
              {[
                { step: "01", title: "Create Your Store", desc: "Sign up, pick a name, upload your logo — your branded storefront is live instantly. No tech skills needed.", color: "#ff751f" },
                { step: "02", title: "Add Your Products", desc: "Add products with photos, prices, and descriptions. Supports digital goods, physical products, and services.", color: "#6366f1" },
                { step: "03", title: "Get Paid Instantly", desc: "Share your store link anywhere. When customers buy, money goes straight to you — 100%, no commission.", color: "#10b981" },
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="flex gap-5 group">
                  <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg transition-transform group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg,${color},${color}cc)` }}>
                    {step}
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-xl font-bold" style={{ color: "#0b183f" }}>{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS ════════════════════ */}
      <section className="py-20 sm:py-24" style={{ background: "linear-gradient(135deg,#0b183f 0%,#0f2157 100%)" }}>
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
      </section>

      {/* ════════════════════ COMMUNITY ════════════════════ */}
      <section id="community" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div ref={communitySection.ref}
              className={`transition-all duration-700 ${communitySection.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <span className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f" }}>Seller Community</span>
              <h2 className="mb-5 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
                A Caring Community<br />to Help You <span style={{ color: "#ff751f" }}>Stay on Track</span>
              </h2>
              <p className="mb-7 text-lg leading-relaxed text-slate-500">
                Join thousands of smart business owners who are reclaiming their profits with ZENSOS. Get support, share strategies, and grow together with a passionate seller community.
              </p>
              <div className="mb-8 grid grid-cols-2 gap-4">
                {[
                  { icon: "🤝", text: "Peer support groups" },
                  { icon: "📚", text: "Seller playbooks & guides" },
                  { icon: "🎓", text: "Weekly live workshops" },
                  { icon: "💬", text: "Direct seller chat" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,117,31,0.06)" }}>
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-semibold text-slate-700">{text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/login?tab=register")}
                className="rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
                Join Now For Free →
              </button>
            </div>
            <div className={`transition-all duration-700 delay-200 ${communitySection.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20" style={{ background: "linear-gradient(135deg,#ff751f,#6366f1)" }} />
                <img src={communitySellers} alt="ZENSOS seller community" className="relative w-full rounded-3xl shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ PRICING ════════════════════ */}
      <section id="pricing" className="py-20 sm:py-28" style={{ background: "#fff7f0" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={pricingSection.ref}
            className={`text-center mb-14 transition-all duration-700 ${pricingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-3"
              style={{ background: "rgba(255,117,31,0.12)", color: "#ff751f" }}>Pricing</span>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "#0b183f" }}>
              Simple, Transparent<br /><span style={{ color: "#ff751f" }}>Pricing</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">No hidden fees. No commission. Pay only for the plan that fits your business.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter", price: "Free", period: "forever", color: "#6366f1",
                features: ["1 Store", "Up to 10 Products", "Basic Analytics", "Community Access", "Email Support"],
                cta: "Get Started Free", popular: false,
              },
              {
                name: "Growth", price: "₹999", period: "/month", color: "#ff751f",
                features: ["3 Stores", "Unlimited Products", "Advanced Analytics", "Priority Support", "Custom Domain", "Bulk Import"],
                cta: "Start Growing", popular: true,
              },
              {
                name: "Pro", price: "₹2499", period: "/month", color: "#10b981",
                features: ["Unlimited Stores", "Unlimited Products", "Real-time Analytics", "24/7 Dedicated Support", "White-label Option", "API Access"],
                cta: "Go Pro", popular: false,
              },
            ].map(({ name, price, period, color, features, cta, popular }, i) => (
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
                    ✦ MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: popular ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>{name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black" style={{ color: popular ? "#fff" : "#0b183f" }}>{price}</span>
                    <span className="mb-1.5 text-sm font-medium" style={{ color: popular ? "rgba(255,255,255,0.5)" : "#94a3b8" }}>{period}</span>
                  </div>
                </div>
                <ul className="mb-8 space-y-3">
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

      {/* ════════════════════ CTA BANNER ════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: "linear-gradient(135deg,#0b183f 0%,#1a1060 100%)" }}>
        <div ref={ctaSection.ref} className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className={`transition-all duration-700 ${ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="mb-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Start Selling Directly <span style={{ color: "#ff751f" }}>Today</span>
            </h2>
            <p className="mb-10 text-lg text-slate-400">
              Join thousands of smart business owners reclaiming their profits. Setup takes less than 10 minutes.
            </p>

            {subscribed ? (
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
            )}

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button onClick={() => navigate("/login?tab=register")}
                className="rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)", boxShadow: "0 8px 32px rgba(255,117,31,0.45)" }}>
                Start Selling →
              </button>
              <button onClick={() => scrollTo("pricing")}
                className="rounded-2xl border px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.25)" }}>
                Check Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="border-t py-16" style={{ background: "#0b183f", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="mb-5">
                {/* Real ZENSOS logo — white/inverted for dark footer */}
                <img
                  src={ZENSOS_LOGO_LIGHT}
                  alt="ZENSOS"
                  className="h-10 w-auto object-contain brightness-0 invert"
                  style={{ maxWidth: "9rem" }}
                />
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-400">
                The future of e-commerce. Build your store, sell directly, get paid instantly.
              </p>
              <div className="flex gap-3">
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
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Product</h4>
              <ul className="space-y-3">
                {[["Features", "features"], ["How It Works", "how-it-works"], ["Pricing", "pricing"], ["Community", "community"]].map(([label, id]) => (
                  <li key={label}>
                    <button onClick={() => scrollTo(id)} className="text-sm text-slate-400 transition-colors hover:text-orange-400">{label}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Support</h4>
              <ul className="space-y-3">
                {["Product Help", "Learn & Care", "Partner With Us", "Community Forum"].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-slate-400 transition-colors hover:text-orange-400">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-400 transition-colors hover:text-orange-400">About Us</a></li>
                <li><a href="#" className="text-sm text-slate-400 transition-colors hover:text-orange-400">Careers</a></li>
                <li><a href="#" className="text-sm text-slate-400 transition-colors hover:text-orange-400">News & Press</a></li>
                <li><Link to="/privacy-policy" className="text-sm text-slate-400 transition-colors hover:text-orange-400">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-slate-400 transition-colors hover:text-orange-400">Terms of Use</Link></li>
                <li><Link to="/refund-policy" className="text-sm text-slate-400 transition-colors hover:text-orange-400">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-sm text-slate-500">© 2026 ZENSOS. All rights reserved. Powered by ZENSOS.</p>
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
