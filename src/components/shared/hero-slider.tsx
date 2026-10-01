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
    sub: "Join verified business groups across Bangladesh. Earn competitive returns with full transparency and legal protection.",
  },
  {
    src: "/resized 2.png",
    headline: "Real Projects,",
    highlight: "Real Returns",
    sub: "Every investment opportunity is admin-reviewed, KYC-gated, and backed by a signed digital contract.",
  },
  {
    src: "/resized 3.png",
    headline: "Transparent Platform,",
    highlight: "Immutable Ledger",
    sub: "Track every taka in real time. Our double-entry ledger ensures your funds are always accounted for.",
  },
  {
    src: "/resized 4.png",
    headline: "Join Bangladesh's",
    highlight: "Trusted Investors",
    sub: "Become part of a growing community of verified investors. Transparent processes, legal protection, and real results.",
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
      }, 400);
    },
    [animating],
  );

  useEffect(() => {
    const t = setInterval(() => go(current + 1), 5500);
    return () => clearInterval(t);
  }, [current, go]);

  const slide = SLIDES[current];

  return (
    <section className="relative -mt-16 w-full overflow-hidden bg-brand-900" style={{aspectRatio: "3/1", maxHeight: "900px", minHeight: "300px"}}>
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
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

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pt-16 pb-16 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-4xl text-center transition-all duration-500 rounded-2xl px-6 py-8 sm:px-10 sm:py-10 bg-black/30 backdrop-blur-sm ${animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
        >
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-7xl leading-[1.1]">
            {slide.headline}{" "}
            <span className="text-brand-300 drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
              {slide.highlight}
            </span>
          </h1>

          <p className="mb-8 mx-auto max-w-2xl text-base text-white leading-relaxed sm:text-lg lg:text-xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            {slide.sub}
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-brand-400 hover:-translate-y-0.5 sm:px-8 sm:py-3.5 sm:text-base"
            >
              Start Investing
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-white/90 px-7 py-3 text-sm font-medium text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:-translate-y-0.5 sm:px-8 sm:py-3.5 sm:text-base"
            >
              Explore Groups
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 h-2 bg-primary"
                : "w-2 h-2 bg-white/30 hover:bg-primary/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={() => go(current - 1)}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:left-6"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(current + 1)}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:right-6"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
