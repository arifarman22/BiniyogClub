import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Invest: [
    { href: "/projects", label: "Browse Projects" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/faq", label: "FAQ" },
    { href: "/register", label: "Create Account" },
  ],
  Platform: [
    { href: "/farmers", label: "Our Farmers" },
    { href: "/updates", label: "Project Updates" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About Us" },
  ],
  Support: [
    { href: "/contact", label: "Contact Us" },
    { href: "/faq", label: "Help Center" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

const SOCIAL = [
  { href: "https://facebook.com", label: "Facebook", abbr: "fb" },
  { href: "https://twitter.com", label: "Twitter", abbr: "tw" },
  { href: "https://linkedin.com", label: "LinkedIn", abbr: "in" },
  { href: "https://youtube.com", label: "YouTube", abbr: "yt" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
              <Image
                src="/Biniyog Club Logo Icon PNG.png"
                alt="Biniyog Club"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span>
                Biniyog<span className="text-primary"> Club</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Bangladesh&apos;s trusted agricultural investment platform. Connecting investors with
              verified farmers to grow wealth and food security together.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIAL.map(({ href, label, abbr }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {abbr}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{heading}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Biniyog Club Ltd. All rights reserved. Registered in
            Bangladesh.
          </p>
          <p className="text-xs text-muted-foreground">
            Investment involves risk. Past returns do not guarantee future performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
