import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BadgeCheck, FileSignature, ShieldCheck } from "lucide-react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Background photo for the desktop brand panel. */
  image?: string;
  quote?: string;
  quoteAuthor?: string;
  /** "wide" gives long forms (registration) a wider column on desktop. */
  size?: "default" | "wide";
}

const TRUST_POINTS = [
  { icon: BadgeCheck, text: "Admin-vetted projects and business groups" },
  { icon: FileSignature, text: "Every investment backed by a legal contract" },
  { icon: ShieldCheck, text: "Bank-grade encryption on your data" },
];

/**
 * Auth page shell.
 * - Desktop (lg+): split screen — fixed brand panel on the left, scrollable form on the right.
 * - Mobile: compact top bar and a full-width form, no side panel.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  image = "/2.png",
  quote,
  quoteAuthor,
  size = "default",
}: AuthCardProps) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* ── Desktop brand panel ── */}
      <aside className="relative hidden w-[44%] max-w-[640px] shrink-0 overflow-hidden bg-[#040d09] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Image src={image} alt="" fill priority className="object-cover opacity-25" sizes="44vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040d09]/80 via-[#040d09]/70 to-[#040d09]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(16,185,129,0.22),transparent)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="relative block h-10 w-40">
            <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain object-left brightness-0 invert" priority />
          </Link>

          <div className="space-y-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                <span className="h-px w-6 bg-emerald-400/70" />
                Biniyog Club
              </div>
              <h2 className="text-3xl font-light leading-[1.15] tracking-tight xl:text-4xl">
                Invest in verified{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
                  Bangladeshi businesses
                </span>
              </h2>
            </div>

            <ul className="space-y-3">
              {TRUST_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-400/10 text-emerald-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {quote ? (
            <figure className="border-l-2 border-emerald-400/60 pl-4">
              <blockquote className="text-sm leading-relaxed text-slate-300">&ldquo;{quote}&rdquo;</blockquote>
              {quoteAuthor && <figcaption className="mt-2 text-xs font-semibold text-emerald-300">— {quoteAuthor}</figcaption>}
            </figure>
          ) : (
            <span />
          )}
        </div>
      </aside>

      {/* ── Form side ── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: logo on mobile, back link everywhere */}
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:border-b-0 lg:px-10 lg:py-6">
          <Link href="/" className="relative block h-8 w-28 lg:invisible">
            <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain object-left" priority />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </header>

        <div className="flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:items-center lg:px-10 lg:pb-12">
          <div className={`w-full ${size === "wide" ? "max-w-2xl" : "max-w-md"}`}>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>

            {/* Card on tablet/desktop; flat on phones to save space */}
            <div className="sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-8 sm:shadow-sm">
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}

            <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 lg:hidden">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Bank-grade encryption · Legal contract protection
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
