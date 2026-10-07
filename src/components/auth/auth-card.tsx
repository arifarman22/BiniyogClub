import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, Lock, CheckCircle2, Star, ArrowLeft } from "lucide-react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  image?: string;
  quote?: string;
  quoteAuthor?: string;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  image = "/resized 1.png",
  quote = "Real projects, real returns. Every investment opportunity is admin-reviewed, KYC-gated, and backed by a signed digital contract.",
  quoteAuthor = "Biniyog Club Community",
}: AuthCardProps) {
  return (
    <div className="flex w-full flex-col lg:flex-row">
      {/* ── Left Showcase Panel (Desktop) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">
        {/* Background Image & Multi-layer Vignette */}
        <Image
          src={image}
          alt="Biniyog Club Investments"
          fill
          className="object-cover object-center opacity-40 scale-105"
          sizes="50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/75" />
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Top Header & Home Navigation */}
        <div className="relative z-10 flex items-center justify-between">
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
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-white/90 transition-all hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </div>

        {/* Center Live Value Proposition Card */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-md">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Trusted by 1,200+ Verified Bangladeshi Investors</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Direct Co-Investment in{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              High-Growth Ventures
            </span>
          </h2>

          <div className="space-y-3 pt-2">
            {[
              "Multi-stage financial and legal due diligence before listing",
              "100% digital legal contracts backed by Bangladesh Contract Act",
              "Immutable double-entry financial ledger with live updates",
            ].map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm text-slate-200">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Testimonial Banner */}
        <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-6">
          <div className="flex items-center gap-1 text-amber-400 mb-2.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
            <span className="ml-2 text-xs font-semibold text-white/80">Verified Platform Track Record</span>
          </div>
          <p className="text-sm font-normal text-slate-200 leading-relaxed italic">
            &ldquo;{quote}&rdquo;
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-2.5">
            <span className="font-semibold text-white">{quoteAuthor}</span>
            <span className="text-emerald-400 font-medium">100% On-time Disbursals</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-5 py-8 sm:px-12 lg:px-16 overflow-y-auto min-h-screen lg:min-h-0">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md space-y-6">
          {/* Mobile brand header */}
          <div className="flex flex-col items-center justify-center lg:hidden space-y-3 mb-2">
            <Link href="/" className="inline-flex items-center">
              <div className="relative h-10 w-36">
                <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain" priority />
              </div>
            </Link>
          </div>

          {/* Form Header */}
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-2.5">
              <Lock className="h-3 w-3" />
              <span>SECURE INVESTOR ACCESS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Form Card Container */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-900/5">
            {children}
          </div>

          {/* Footer Navigation */}
          {footer && (
            <div className="text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}

          {/* Security Assurance Badge */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>256-Bit Bank-Grade SSL & Legal Contract Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
