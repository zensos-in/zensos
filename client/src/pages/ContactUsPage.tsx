import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function ContactUsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    captchaInput: "",
  });

  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, result: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a new simple math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ num1, num2, result: num1 + num2 });
    setFormData((prev) => ({ ...prev, captchaInput: "" }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    generateCaptcha();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      setError("Please fill out all fields.");
      return;
    }

    if (parseInt(formData.captchaInput) !== captcha.result) {
      setError("Incorrect captcha answer. Please try again.");
      generateCaptcha();
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/contact", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        captchaInput: "",
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send message. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
      generateCaptcha();
    }
  };

  const handleFooterNavigate = (id: string) => {
    navigate(`/#${id}`);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <div>
        {/* Simple Header */}
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-4 text-center">
          <h1 className="font-heading text-4xl font-black text-[#0b183f] dark:text-white tracking-tight">
            Contact Us
          </h1>
          <div className="mt-2 h-1 w-16 bg-[#ff751f] mx-auto rounded-full" />
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">

            {/* Left Column: Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b183f] dark:text-slate-100 tracking-tight">
                    For Collaborations
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Feel free to reach out to us via call or email.
                  </p>
                </div>

                <div className="space-y-6">

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/20 text-[#10b981]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.28-5.116-3.573-6.4-6.4l1.293-.97a1.248 1.248 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</h4>
                      <a href="tel:+919986703161" className="mt-1 block text-sm text-slate-500 hover:text-[#ff751f] dark:text-slate-400 font-semibold transition-colors">
                        +91 9986703161
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/20 text-[#6366f1]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</h4>
                      <a href="mailto:naik@shankaraonline.com" className="mt-1 block text-sm text-slate-500 hover:text-[#ff751f] dark:text-slate-400 font-semibold transition-colors">
                        naik@shankaraonline.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="h-16 w-16 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#0b183f] dark:text-slate-100">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                      Thank you for contacting us. We have received your message and will get back to you shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                        ⚠️ {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. John Doe"
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold outline-none focus:border-[#ff751f] dark:focus:border-[#ff751f] text-slate-800 dark:text-slate-100 transition-colors"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          placeholder="e.g. +91 9986703161"
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold outline-none focus:border-[#ff751f] dark:focus:border-[#ff751f] text-slate-800 dark:text-slate-100 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="e.g. john@example.com"
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold outline-none focus:border-[#ff751f] dark:focus:border-[#ff751f] text-slate-800 dark:text-slate-100 transition-colors"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="How can we help your business?"
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold outline-none focus:border-[#ff751f] dark:focus:border-[#ff751f] text-slate-800 dark:text-slate-100 transition-colors resize-none"
                      />
                    </div>

                    {/* Captcha */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-slate-600 dark:text-slate-400">
                          Solve this:
                        </span>
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-black text-slate-800 dark:text-slate-100 tracking-wider text-base">
                          {captcha.num1} + {captcha.num2} = ?
                        </div>
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className="text-xs font-bold text-[#ff751f] hover:underline"
                        >
                          Refresh
                        </button>
                      </div>
                      <input
                        type="number"
                        name="captchaInput"
                        value={formData.captchaInput}
                        onChange={handleChange}
                        required
                        placeholder="Your Answer"
                        className="w-full sm:w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold outline-none focus:border-[#ff751f] text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:opacity-95 active:scale-100 disabled:opacity-50 disabled:scale-100"
                      style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)", boxShadow: "0 6px 20px rgba(255,117,31,0.3)" }}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
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
                    <button onClick={() => handleFooterNavigate(id)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-orange-400"><span className="text-orange-400 text-xs">›</span>{label}</button>
                  </li>
                ))}
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
                    <button onClick={() => window.location.href = 'Mail to:naik@shankaraonline.com'} className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100" style={{ background: "linear-gradient(135deg,#ff751f,#ff4500)" }}>Partner With Us</button>
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
