"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CONTACT_INFO = [
  {
    icon: <Mail className="h-5 w-5" />,
    label: "Email",
    value: "support@biniyog.club",
    sub: "We reply within 24 hours",
  },
  {
    icon: <Phone className="h-5 w-5" />,
    label: "Phone",
    value: "+880 1700-000000",
    sub: "Sun–Thu, 9am–6pm BST",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: "Office",
    value: "Gulshan-2, Dhaka 1212",
    sub: "Bangladesh",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    label: "Support Hours",
    value: "Sunday – Thursday",
    sub: "9:00 AM – 6:00 PM BST",
  },
];

const INQUIRY_TYPES = [
  "General Inquiry",
  "Investor Support",
  "Farmer Application",
  "Partnership",
  "Media & Press",
  "Technical Issue",
];

export default function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with server action
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">Get in Touch</Badge>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">Contact Us</h1>
          <p className="text-lg text-brand-100/90">
            Have a question, want to apply as a farmer, or explore a partnership? We&apos;d love to
            hear from you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Contact info */}
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Reach Us Directly</h2>
              {CONTACT_INFO.map(({ icon, label, value, sub }) => (
                <div key={label} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-sm">{value}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-8">
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl">
                      ✓
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-6 text-xl font-bold">Send a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Your full name"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium">Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+880 1XXX-XXXXXX"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium">Inquiry Type</label>
                          <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                            {INQUIRY_TYPES.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Message</label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Tell us how we can help..."
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Message <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
