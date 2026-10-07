"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { cn } from "cn";

const LANGUAGES = [
  { code: "en",    label: "English",  flag: "🇬🇧" },
  { code: "bn",    label: "বাংলা",    flag: "🇧🇩" },
  { code: "zh-CN", label: "中文",     flag: "🇨🇳" },
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          opts: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          el: string,
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

function getActiveLang(): string {
  const cookie = getCookie("googtrans");
  if (!cookie) return "en";
  // cookie format: /en/zh-CN  or  /en/bn
  const parts = cookie.split("/");
  return parts[2] ?? "en";
}

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  // Inject hidden Google Translate element + script once
  useEffect(() => {
    if (document.getElementById("google_translate_element")) return;

    const el = document.createElement("div");
    el.id = "google_translate_element";
    el.style.display = "none";
    document.body.appendChild(el);

    window.googleTranslateElementInit = () => {
      new window.google!.translate!.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,bn,zh-CN", autoDisplay: false },
        "google_translate_element",
      );
    };

    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Sync active language from cookie on mount
  useEffect(() => {
    setActive(getActiveLang());
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function switchLang(code: string) {
    setActive(code);
    setOpen(false);

    // Set the googtrans cookie that Google Translate reads
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${code};path=/;domain=${domain}`;
    document.cookie = `googtrans=/en/${code};path=/`;

    // Trigger the hidden Google Translate select element
    const frame = document.querySelector<HTMLIFrameElement>(".goog-te-menu-frame");
    if (frame) {
      const select = frame.contentDocument?.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (select) {
        select.value = code;
        select.dispatchEvent(new Event("change"));
        return;
      }
    }
    // Fallback: find the combo in the page directly
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event("change"));
      return;
    }
    // Last resort: reload with cookie set
    window.location.reload();
  }

  const current = LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all"
        aria-label="Select language"
      >
        <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
        <span>{current.flag} {current.label}</span>
        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[200] min-w-[130px] overflow-hidden rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-black/40 animate-in fade-in slide-in-from-top-1 duration-150">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors text-left",
                active === lang.code
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {active === lang.code && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Hide Google Translate toolbar injected into page */}
      <style>{`
        .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame,
        .goog-tooltip, .goog-tooltip:hover, .goog-text-highlight { display: none !important; }
        body { top: 0 !important; }
        .skiptranslate { display: none !important; }
      `}</style>
    </div>
  );
}
