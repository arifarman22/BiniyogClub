"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";

const SLIDES = [
  {
    src: "/resized 1.png",
    headline: "Grow Your Wealth,",
    highlight: "Invest in Bangladesh",
    sub: "Join verified business groups across Bangladesh. Earn competitive returns with institutional transparency and legal protection.",
  },
  {
    src: "/resized 2.png",
    headline: "Real Projects,",
    highlight: "Real Returns",
    sub: "Every investment opportunity is admin-reviewed, KYC-gated, and backed by an enforceable digital legal contract.",
  },
  {
    src: "/resized 3.png",
    headline: "Transparent Platform,",
    highlight: "Immutable Ledger",
    sub: "Track every taka in real time. Our double-entry financial ledger ensures your funds are always accounted for.",
  },
  {
    src: "/resized 4.png",
    headline: "Join Bangladesh's",
    highlight: "Trusted Investors",
    sub: "Become part of an elite community of verified investors. Transparent processes, legal security, and scheduled disbursements.",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent((next + SLIDES.length) % SLIDES.length);
        setAnimating(false);
      }, 350);
    },
    [animating],
  );

  useEffect(() => {
    const t = setInterval(() => go(current + 1), 6000);
    return () => clearInterval(t);
  }, [current, go]);

  const slide = SLIDES[current];

  return (
    <section className="relative -mt-24 sm:-mt-[100px] w-full overflow-hidden bg-slate-950 min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] h-[82vh] max-h-[820px] flex items-center justify-center">
      {/* Slides Background Images */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}`}
          style={{ transitionProperty: "opacity, transform" }}
        >
          <Image
            src={s.src}
            alt=""
            fill
            className="object-cover object-center"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-slate-950/70" />
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-20 sm:pt-28 pb-16 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center">
        {/* Dynamic Animated Text Block */}
        <div
          className={`transition-all duration-500 max-w-4xl ${
            animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-light tracking-widest text-emerald-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>INSTITUTIONAL DIRECT INVESTMENT</span>
          </div>

          <h1 className="mb-5 text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.12]">
            {slide.headline}{" "}
            <span className="font-normal bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              {slide.highlight}
            </span>
          </h1>

          <p className="mb-8 mx-auto max-w-2xl text-base sm:text-lg lg:text-xl font-light text-slate-200/85 leading-relaxed">
            {slide.sub}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm sm:text-base font-normal text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              Start Investing
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/groups"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-8 py-3.5 text-sm sm:text-base font-light sm:font-normal text-white transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              Explore Groups
              <ChevronRight className="h-4 w-4 text-white/70" />
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === current
                ? "w-8 bg-emerald-400 shadow-sm shadow-emerald-400/50"
                : "w-2 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Previous / Next Controls */}
      <button
        onClick={() => go(current - 1)}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 backdrop-blur-md transition-all duration-200 hover:bg-black/60 hover:text-white hover:scale-105 sm:left-8"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(current + 1)}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 backdrop-blur-md transition-all duration-200 hover:bg-black/60 hover:text-white hover:scale-105 sm:right-8"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
