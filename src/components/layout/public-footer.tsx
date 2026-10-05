import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

const FOOTER_LINKS = {
  Invest: [
    { href: "/groups", label: "Business Groups" },
    { href: "/projects", label: "Browse Projects" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/auth/register", label: "Create Account" },
  ],
  Platform: [
    { href: "/updates", label: "Project Updates" },
    { href: "/about", label: "About Us" },
    { href: "/faq", label: "Frequently Asked" },
    { href: "/contact", label: "Investor Relations" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/about", label: "Risk Disclosures" },
    { href: "/faq", label: "Compliance & KYC" },
  ],
};

const SOCIAL = [
  {
    href: "https://www.facebook.com/BiniyogClub",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    href: "https://www.youtube.com/@BiniyogClub",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#091511] via-[#06100D] to-[#030806] text-slate-300 border-t border-emerald-900/40 shadow-[0_-4px_30px_rgba(0,140,100,0.07)]">
      {/* Ambient background glow orb */}
      <div className="absolute top-0 right-1/4 -mt-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center group">
              <div className="relative h-11 w-36 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Biniyog Club"
                  fill
                  className="object-contain object-left brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm text-slate-400 leading-relaxed">
              Empowering co-investors across Bangladesh to fund verified business groups and projects with complete legal security and radical transparency.
            </p>

            {/* Platform security tag */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1 text-xs text-emerald-300 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Immutable Ledger & Digital Contracts</span>
            </div>

            {/* Social handles */}
            <div className="mt-6 flex gap-2.5">
              {SOCIAL.map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:border-emerald-400/50 hover:bg-emerald-950/60 hover:text-emerald-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/50"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-emerald-300 inline-flex items-center gap-1 group"
                    >
                      <span>{link.label}</span>
                      <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400 text-xs">
                        &rsaquo;
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info & Map Showcase */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 pt-10 border-t border-white/10">
          {/* Office Contact details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Corporate Headquarters
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                <span>MG SAM Center, 12 Mohakhali C/A, Dhaka-1212, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
                <a href="tel:+8801335149033" className="transition-colors hover:text-emerald-300 font-medium">
                  +880 1335-149033
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                <a href="mailto:info@biniyogclub.com" className="transition-colors hover:text-emerald-300 font-medium">
                  info@biniyogclub.com
                </a>
              </li>
            </ul>
          </div>

          {/* Interactive Map */}
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            <iframe
              title="Biniyog Club Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.6!2d90.4018!3d23.7806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7715a40a947%3A0x517e5e5e5e5e5e5e!2s12%20Mohakhali%20C%2FA%2C%20Dhaka%201212!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
              width="100%"
              height="180"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Biniyog Club Ltd. All rights reserved. Registered in Bangladesh.
          </p>
          <p className="text-xs text-slate-400 text-center sm:text-right">
            Investment carries commercial risk. Past payouts do not guarantee future returns.
          </p>
        </div>
      </div>
    </footer>
  );
}
