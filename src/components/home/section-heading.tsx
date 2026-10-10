import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  highlight?: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Shared heading used by every homepage section: eyebrow label,
 * light/semibold split title, and an optional supporting paragraph.
 */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = "center",
  tone = "light",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";

  return (
    <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      <div
        className={cn(
          "mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]",
          dark ? "text-emerald-300" : "text-primary",
        )}
      >
        <span className={cn("h-px w-6", dark ? "bg-emerald-400/70" : "bg-primary/60")} />
        {eyebrow}
        {align === "center" && <span className={cn("h-px w-6", dark ? "bg-emerald-400/70" : "bg-primary/60")} />}
      </div>

      <h2
        className={cn(
          "text-3xl font-light leading-[1.15] tracking-tight text-balance sm:text-4xl lg:text-5xl",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
        {highlight && (
          <>
            {" "}
            <span
              className={cn(
                "bg-clip-text font-semibold text-transparent",
                dark
                  ? "bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400"
                  : "bg-gradient-to-r from-brand-700 via-brand-500 to-teal-500",
              )}
            >
              {highlight}
            </span>
          </>
        )}
      </h2>

      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            dark ? "text-slate-300" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
