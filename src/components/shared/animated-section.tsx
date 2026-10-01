"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "fade-down" | "fade-in" | "fade-left" | "fade-right" | "zoom-in";
}

export function AnimatedSection({ children, className = "", delay = 0, animation = "fade-up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden: Record<string, string> = {
    "fade-up":    "translate-y-10 opacity-0",
    "fade-down":  "-translate-y-10 opacity-0",
    "fade-in":    "opacity-0",
    "fade-left":  "-translate-x-10 opacity-0",
    "fade-right": "translate-x-10 opacity-0",
    "zoom-in":    "scale-95 opacity-0",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${visible ? "translate-y-0 translate-x-0 scale-100 opacity-100" : hidden[animation]} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
