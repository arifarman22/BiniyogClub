import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Hero — the brand video, with the main calls to action overlaid on it.
 */
export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background h-[50vh] sm:h-[65vh] md:h-[75vh] lg:h-[82vh] max-h-[850px]">
      <video
        src="/logo with money.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      <div className="absolute inset-x-0 bottom-3 z-10 flex flex-col items-center justify-center gap-3 px-4 sm:bottom-5 sm:flex-row">
        <Link
          href="/projects"
          className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-none bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/25 transition-colors hover:bg-brand-700 sm:w-auto"
        >
          Explore Opportunities
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex w-full max-w-xs items-center justify-center rounded-none border border-brand-600 bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-md shadow-black/10 transition-colors hover:bg-secondary sm:w-auto"
        >
          How It Works
        </a>
      </div>
    </section>
  );
}
