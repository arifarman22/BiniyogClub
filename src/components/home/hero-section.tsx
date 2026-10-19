import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Hero — the brand video, faded into the background, with the page headline,
 * supporting copy and the main calls to action laid over it.
 */
export function HeroSection() {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-background min-h-[560px] h-[75vh] max-h-[850px]">
      <video
        src="/logo with money.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-25"
      />
      {/* Soft wash so the text reads cleanly over the moving video */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/80" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <p className="mb-5 inline-flex items-center gap-2 border border-primary/30 bg-background/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Bangladesh&apos;s direct investment platform
        </p>

        <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Your Gateway to <br className="hidden sm:block" />
          <span className="font-semibold text-primary">Real Business Opportunities</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Invest directly in vetted Bangladeshi businesses — from real estate to food and hospitality —
          with legally binding agreements, segregated capital and transparent reporting at every step.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/projects"
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-none bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-brand-700 sm:w-auto"
          >
            Explore Opportunities
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex w-full max-w-xs items-center justify-center rounded-none border border-brand-600 bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-md shadow-black/5 transition-colors hover:bg-secondary sm:w-auto"
          >
            How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
