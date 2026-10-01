import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Invest: [
    { href: "/groups", label: "Business Groups" },
    { href: "/projects", label: "Browse Projects" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/auth/register", label: "Create Account" },
  ],
  Platform: [
    { href: "/updates", label: "Project Updates" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About Us" },
    { href: "/faq", label: "FAQ" },
  ],
  Support: [
    { href: "/contact", label: "Contact Us" },
    { href: "/faq", label: "Help Center" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

const SOCIAL = [
  { href: "https://facebook.com", label: "Facebook", abbr: "f" },
  { href: "https://twitter.com", label: "Twitter", abbr: "𝕏" },
  { href: "https://linkedin.com", label: "LinkedIn", abbr: "in" },
  { href: "https://youtube.com", label: "YouTube", abbr: "▶" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-32 overflow-hidden">
                <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain object-left" />
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Bangladesh&apos;s trusted investment platform. Connecting investors with
              verified business groups to grow wealth together.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIAL.map(({ href, label, abbr }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs font-bold text-muted-foreground transition-all hover:border-primary hover:text-primary hover:-translate-y-0.5"
                >
                  {abbr}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">{heading}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Biniyog Club Ltd. All rights reserved. Registered in Bangladesh.
          </p>
          <p className="text-xs text-muted-foreground">
            Investment involves risk. Past returns do not guarantee future performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
