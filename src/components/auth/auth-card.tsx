import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";

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
}: AuthCardProps) {
  return (
    <div className="relative flex w-full min-h-dvh flex-col items-center justify-start bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10 sm:px-6">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl space-y-5">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <div className="relative h-10 w-36">
              <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain" priority />
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </div>

        {/* Form Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-3">
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
        <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-10 shadow-xl shadow-slate-900/5">
          {children}
        </div>

        {/* Footer Navigation */}
        {footer && (
          <div className="text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}

        {/* Security Assurance Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 pb-4">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>256-Bit Bank-Grade SSL & Legal Contract Protection</span>
        </div>
      </div>
    </div>
  );
}
