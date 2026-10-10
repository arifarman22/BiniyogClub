"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";
import { submitContactInquiryAction } from "@/server/actions/contact.actions";
import { CONTACT_INQUIRY_TYPES, type ContactInput } from "@/validations/contact";

const CONTACT_CARDS: {
  icon: LucideIcon;
  title: string;
  value: string;
  sub: string;
  action: string;
  href: string;
}[] = [
  {
    icon: MapPin,
    title: "Head office",
    value: "MG SAM Center, 12 Mohakhali C/A",
    sub: "Dhaka-1212, Bangladesh",
    action: "View on map",
    href: "https://maps.google.com/?q=MG+SAM+Center+12+Mohakhali+C/A+Dhaka",
  },
  {
    icon: Phone,
    title: "Investor hotline",
    value: "+880 1335-149033",
    sub: "Phone & WhatsApp support",
    action: "Call now",
    href: "tel:+8801335149033",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@biniyogclub.com",
    sub: "We aim to reply within one business day",
    action: "Send email",
    href: "mailto:info@biniyogclub.com",
  },
  {
    icon: Clock,
    title: "Office hours",
    value: "Saturday – Thursday",
    sub: "9:00 AM – 6:00 PM (Friday closed)",
    action: "Plan a visit",
    href: "#visit",
  },
];

const EMPTY_FORM: Required<ContactInput> = {
  name: "",
  email: "",
  phone: "",
  inquiryType: CONTACT_INQUIRY_TYPES[0],
  subject: "",
  message: "",
  website: "",
};

const inputClass =
  "w-full border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactPageClient() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const update = (key: keyof ContactInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const fieldProps = (key: keyof ContactInput) => ({
    id: `contact-${key}`,
    name: key,
    value: form[key],
    onChange: update(key),
    "aria-invalid": fieldErrors[key] ? true : undefined,
    "aria-describedby": fieldErrors[key] ? `contact-${key}-error` : undefined,
    className: `${inputClass} ${fieldErrors[key] ? "border-destructive" : "border-border"}`,
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await submitContactInquiryAction(form);
      if (result.success) {
        setSubmitted(true);
        setFieldErrors({});
        setForm(EMPTY_FORM);
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.fieldErrors ? null : result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-[#040d09] pb-36 pt-20 text-white lg:pb-40 lg:pt-28">
        <div className="pointer-events-none absolute inset-0">
          <Image src="/images/about-due-diligence.jpg" alt="" fill priority className="object-cover opacity-15" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040d09]/70 via-[#040d09]/85 to-[#040d09]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />
        </div>

        <AnimatedSection animation="fade-down" className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-px w-5 bg-emerald-400/70" />
            Contact us
            <span className="h-px w-5 bg-emerald-400/70" />
          </div>
          <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            We&apos;re here to guide your{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
              investment journey
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Questions about investing, due diligence, or listing your business group? Reach our team in Mohakhali,
            Dhaka.
          </p>
        </AnimatedSection>
      </section>

      {/* ── 2. Contact cards (overlap hero) ── */}
      <section className="relative z-20 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_CARDS.map(({ icon: Icon, title, value, sub, action, href }, i) => {
            const external = href.startsWith("http");
            return (
              <AnimatedSection key={title} delay={i * 80} animation="fade-up" className="h-full">
                <div className="group flex h-full flex-col border border-border bg-card p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
                  <p className="mt-1 text-base font-semibold leading-snug text-foreground">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="mt-auto inline-flex items-center gap-1.5 border-t border-border pt-4 text-sm font-semibold text-primary hover:underline"
                  >
                    {action}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* ── 3. Form + visit info ── */}
      <section className="bg-background py-20 lg:py-24">
        <div className="mx-auto grid grid-cols-1 max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Form */}
          <AnimatedSection animation="fade-right" className="lg:col-span-7">
            <div className="border border-border bg-card p-6 shadow-sm sm:p-10">
              {submitted ? (
                <div className="py-12 text-center" role="status">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-primary/10 text-primary">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">Message sent</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Thank you for contacting Biniyog Club. Our investor relations team will review your inquiry and reply
                    by email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-8 inline-flex items-center border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <>
                  <SectionHeading
                    align="left"
                    eyebrow="Inquiry desk"
                    title="Send us a"
                    highlight="message"
                    description="Fill in your details and our investor desk will get back to you."
                    className="mb-8 max-w-none"
                  />

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* Honeypot — hidden from people, visible to naive bots */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label htmlFor="contact-website">Website</label>
                      <input tabIndex={-1} autoComplete="off" {...fieldProps("website")} />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field id="contact-name" label="Full name" required error={fieldErrors.name}>
                        <input type="text" required autoComplete="name" placeholder="e.g. Tanvir Ahmed" {...fieldProps("name")} />
                      </Field>
                      <Field id="contact-email" label="Email address" required error={fieldErrors.email}>
                        <input type="email" required autoComplete="email" placeholder="e.g. tanvir@example.com" {...fieldProps("email")} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field id="contact-phone" label="Phone number" error={fieldErrors.phone}>
                        <input type="tel" autoComplete="tel" placeholder="+880 17XX-XXXXXX" {...fieldProps("phone")} />
                      </Field>
                      <Field id="contact-inquiryType" label="Nature of inquiry" error={fieldErrors.inquiryType}>
                        <select {...fieldProps("inquiryType")}>
                          {CONTACT_INQUIRY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field id="contact-subject" label="Subject" error={fieldErrors.subject}>
                      <input type="text" placeholder="Brief summary of your question" {...fieldProps("subject")} />
                    </Field>

                    <Field id="contact-message" label="Your message" required error={fieldErrors.message}>
                      <textarea
                        required
                        rows={5}
                        placeholder="Tell us about your investment questions or project requirements…"
                        {...fieldProps("message")}
                        className={`${fieldProps("message").className} resize-none`}
                      />
                    </Field>

                    {formError && (
                      <p role="alert" className="flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={pending}
                      className="group inline-flex w-full items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-brand-500 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                    >
                      {pending ? "Sending…" : "Send inquiry"}
                      {!pending && <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </>
              )}
            </div>
          </AnimatedSection>

          {/* Map + visit info */}
          <AnimatedSection animation="fade-left" delay={100} className="space-y-6 lg:col-span-5">
            <div className="overflow-hidden border border-border bg-card">
              <iframe
                title="Biniyog Club head office location"
                src="https://maps.google.com/maps?q=MG%20SAM%20Center%2C%2012%20Mohakhali%20C%2FA%2C%20Dhaka%201212&z=16&output=embed"
                className="block h-72 w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div id="visit" className="scroll-mt-32 border border-border bg-card p-6 sm:p-7">
              <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">Visiting Biniyog Club</h3>
              <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="font-semibold text-foreground">Address:</strong> MG SAM Center, 12 Mohakhali C/A,
                    Dhaka-1212, Bangladesh
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="font-semibold text-foreground">In-person meetings:</strong> Sat–Thu, 9:00 AM – 6:00
                    PM. An appointment is recommended for group and partnership discussions.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="font-semibold text-foreground">Phone:</strong>{" "}
                    <a href="tel:+8801335149033" className="hover:text-primary">
                      +880 1335-149033
                    </a>{" "}
                    during office hours
                  </span>
                </li>
              </ul>
              <Link
                href="/faq"
                className="group mt-6 inline-flex items-center gap-1.5 border-t border-border pt-5 text-sm font-semibold text-primary hover:underline"
              >
                Read the investor FAQ
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
