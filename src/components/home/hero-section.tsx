"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "cn";

export function HeroSection() {
  const [lang, setLang] = useState<"en" | "bn">("en");

  useEffect(() => {
    if (document.getElementById("gt-script")) return;
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,bn", autoDisplay: false },
        "google_translate_element",
      );
    };
    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const switchLang = useCallback((target: "en" | "bn") => {
    setLang(target);
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      select.value = target;
      select.dispatchEvent(new Event("change"));
    }
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 h-[50vh] sm:h-[65vh] md:h-[75vh] lg:h-[82vh] max-h-[850px] shadow-2xl">
      <video
        src="/logo with money.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Language switcher — top-right corner */}
      <div className="absolute top-4 right-4 z-10 flex items-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm p-0.5 text-xs font-semibold">
        <button
          onClick={() => switchLang("en")}
          className={cn(
            "rounded-full px-3 py-1 transition-all",
            lang === "en" ? "bg-emerald-500 text-white shadow" : "text-slate-300 hover:text-white"
          )}
        >
          EN
        </button>
        <button
          onClick={() => switchLang("bn")}
          className={cn(
            "rounded-full px-3 py-1 transition-all",
            lang === "bn" ? "bg-emerald-500 text-white shadow" : "text-slate-300 hover:text-white"
          )}
        >
          বাং
        </button>
      </div>
      <div id="google_translate_element" className="hidden" />
    </section>
  );
}
