"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_CARDS = [
  {
    icon: "/icons/user.png",
    title: "Corporate Headquarters",
    value: "MG SAM Center, 12 Mohakhali C/A",
    sub: "Dhaka-1212, Bangladesh",
    action: "View on Map",
    href: "https://maps.google.com/?q=12+Mohakhali+C/A+Dhaka",
  },
  {
    icon: "/icons/income.png",
    title: "Investor Hotline",
    value: "+880 1335-149033",
    sub: "Direct phone & WhatsApp support",
    action: "Call Now",
    href: "tel:+8801335149033",
  },
  {
    icon: "/icons/search-engine.png",
    title: "Official Inquiries",
    value: "info@biniyogclub.com",
    sub: "Guaranteed response within 24 hours",
    action: "Send Email",
    href: "mailto:info@biniyogclub.com",
  },
  {
    icon: "/icons/investment.png",
    title: "Desk & Working Hours",
    value: "Sunday – Thursday",
    sub: "9:00 AM – 6:00 PM BST (Fri–Sat Closed)",
    action: "Support Schedule",
    href: "#support-hours",
  },
];

const INQUIRY_TYPES = [
  "Investor Relations & Onboarding",
  "Business Group & Project Partnership",
  "Corporate Syndicate / Large Allocation",
  "Deposit & Payment Verification",
  "Legal, KYC & Compliance Inquiry",
  "General Questions & Feedback",
];

export default function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: INQUIRY_TYPES[0],
    subject: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/70 to-slate-950 py-20 lg:py-24 text-white">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-light tracking-widest text-emerald-300 backdrop-blur-md mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>INVESTOR RELATIONS & SUPPORT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-3xl mx-auto leading-tight">
            We are Here to Guide Your{" "}
            <span className="font-normal bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Investment Journey
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Have questions about institutional co-investments, due diligence procedures, or listing your business group? Reach our team in Mohakhali, Dhaka.
          </p>
        </div>
      </section>

      {/* ── 2. Contact Bento Dock (Unified Emerald Style with Flaticons) ── */}
      <section className="relative z-20 -mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONTACT_CARDS.map((card) => (
            <div
              key={card.title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              {/* Corner Ambient Glow */}
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Image src={card.icon} alt={card.title} width={32} height={32} className="object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-normal text-emerald-700 dark:text-emerald-400 tracking-wider">
                    OFFICIAL
                  </span>
                </div>

                <p className="text-xs font-normal uppercase tracking-wider text-muted-foreground mb-1">
                  {card.title}
                </p>
                <h3 className="text-base font-normal sm:font-medium text-foreground leading-snug">
                  {card.value}
                </h3>
                <p className="text-xs font-light text-muted-foreground mt-1">
                  {card.sub}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5">
                <a
                  href={card.href}
                  target={card.href.startsWith("http") ? "_blank" : undefined}
                  rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1.5 text-xs font-normal text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group-hover:underline"
                >
                  <span>{card.action}</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Main Form & Location Section ── */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-card p-6 sm:p-10 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                {submitted ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-light text-foreground mb-2">Message Successfully Dispatched</h2>
                    <p className="text-sm font-light text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Thank you for contacting Biniyog Club. Our investor relations officer will review your inquiry and respond within 24 business hours.
                    </p>
                    <div className="mt-8">
                      <Button
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: "",
                            email: "",
                            phone: "",
                            inquiryType: INQUIRY_TYPES[0],
                            subject: "",
                            message: "",
                          });
                        }}
                        variant="outline"
                        className="rounded-full border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        Send Another Inquiry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-light text-emerald-600 dark:text-emerald-400 mb-2">
                        <span>DIRECT INQUIRY DESK</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-light text-foreground tracking-tight">
                        Send a Direct Message
                      </h2>
                      <p className="text-xs sm:text-sm font-light text-muted-foreground mt-1">
                        Fill in your details below and our investor desk will connect with you.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-normal text-foreground uppercase tracking-wider mb-2">
                            Full Legal Name <span className="text-emerald-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tanvir Ahmed"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-3 text-sm font-light outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-normal text-foreground uppercase tracking-wider mb-2">
                            Email Address <span className="text-emerald-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. tanvir@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-3 text-sm font-light outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-normal text-foreground uppercase tracking-wider mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+880 17XX-XXXXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-3 text-sm font-light outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-normal text-foreground uppercase tracking-wider mb-2">
                            Nature of Inquiry
                          </label>
                          <select
                            value={formData.inquiryType}
                            onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-3 text-sm font-light outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {INQUIRY_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-normal text-foreground uppercase tracking-wider mb-2">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          placeholder="Brief summary of your question"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-3 text-sm font-light outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-normal text-foreground uppercase tracking-wider mb-2">
                          Your Message <span className="text-emerald-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Please provide details regarding your investment queries or project requirements..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-3 text-sm font-light outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-normal text-sm shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5"
                        >
                          {loading ? (
                            "Transmitting..."
                          ) : (
                            <span className="flex items-center gap-2">
                              Send Inquiry <Send className="h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Right: Map & Headquarters Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Interactive Google Map matching the footer */}
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-card shadow-lg p-2.5">
                <div className="rounded-[1.6rem] overflow-hidden">
                  <iframe
                    title="Biniyog Club Headquarters Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.6!2d90.4018!3d23.7806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7715a40a947%3A0x517e5e5e5e5e5e5e!2s12%20Mohakhali%20C%2FA%2C%20Dhaka%201212!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {/* Office Address & Access Information */}
              <div className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-card p-6 sm:p-7 shadow-sm">
                <h3 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Visiting Biniyog Club
                </h3>

                <ul className="space-y-4 text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-normal text-foreground">Address:</strong> MG SAM Center, 12 Mohakhali C/A, Dhaka-1212, Bangladesh
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-normal text-foreground">In-Person Consultations:</strong> Prior appointment recommended for corporate syndicates and group discussions.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-normal text-foreground">Direct Telephony:</strong> +880 1335-149033 (Available during BST business hours).
                    </span>
                  </li>
                </ul>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-light text-muted-foreground">Regulated & Registered in BD</span>
                  <Link
                    href="/faq"
                    className="text-xs font-normal text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Read Investor FAQ</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
