import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { ZensosLogo } from "./components/ZensosLogo";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicStoreHeaderContext, type PublicStoreHeader } from "./context/PublicStoreHeaderContext";
import { ToastProvider } from "./context/ToastContext";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { PublicStorePage } from "./pages/PublicStorePage";
import { ThankYouPage } from "./pages/ThankYouPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { FAQPage } from "./pages/FAQPage";
import { ContactUsPage } from "./pages/ContactUsPage";
import { GlobalControls } from "./components/GlobalControls";
import { useTheme } from "./context/ThemeContext";

function AppShell() {
  const location = useLocation();
  const { setTheme } = useTheme();
  const [publicStoreHeader, setPublicStoreHeader] = useState<PublicStoreHeader | null>(null);
  const isLanding = location.pathname === "/" || location.pathname === "/faq";
  const isPublicStore = location.pathname.startsWith("/store/");
  const showThemeToggle = !isLanding && !["/contact-us", "/privacy-policy", "/terms", "/refund-policy", "/faq"].includes(location.pathname);

  // Force light theme on all public marketing & login/register pages
  useEffect(() => {
    if (["/", "/login", "/contact-us", "/privacy-policy", "/terms", "/refund-policy", "/faq"].includes(location.pathname)) {
      setTheme("light");
    }
  }, [location.pathname, setTheme]);

  return (
    <PublicStoreHeaderContext.Provider value={{ publicStoreHeader, setPublicStoreHeader }}>
      {/* Landing page has its own full-page layout — no app-shell header */}
      {isLanding ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Routes>
      ) : (
        <div className="min-h-screen">
          <header className="app-shell-header sticky top-0 z-40 px-3 py-3 sm:px-4">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
              {isPublicStore && publicStoreHeader ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  {publicStoreHeader.logo ? (
                    <img
                      src={publicStoreHeader.logo}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-xl border border-slate-200/80 bg-white object-contain p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:h-11 sm:w-11"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold uppercase text-white dark:bg-slate-100 dark:text-slate-950 sm:h-11 sm:w-11">
                      {publicStoreHeader.name.trim().charAt(0) || "S"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Online Store</p>
                    <p className="truncate font-heading text-base font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-lg">
                      {publicStoreHeader.name}
                    </p>
                  </div>
                </div>
              ) : (
                <Link to="/" className="focus:outline-none">
                  <ZensosLogo size="lg" alt="Zensos" />
                </Link>
              )}
              {location.pathname === "/contact-us" && (
                <div className="flex items-center gap-2 md:gap-3">
                  <Link to="/login"
                    className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold transition-all hover:opacity-80 text-slate-700 dark:text-slate-300">
                    Sign In
                  </Link>
                  <Link to="/login?tab=register"
                    className="whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-bold text-white transition-all hover:scale-105 hover:opacity-90 active:scale-100"
                    style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>
                    Start for Free →
                  </Link>
                </div>
              )}
              {showThemeToggle && <GlobalControls />}
            </div>
          </header>
          <Routes>
            <Route path="/store/:sellerSlug" element={<PublicStorePage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfUsePage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/contact-us" element={<ContactUsPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
      )}
    </PublicStoreHeaderContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </BrowserRouter>
  );
}
