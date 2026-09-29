"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  animation?: "fade-up" | "fade-in" | "fade-left" | "fade-right";
}

export function AnimatedSection({ children, className = "", delay = 0, animation = "fade-up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base: Record<string, string> = {
    "fade-up":    "translate-y-8 opacity-0",
    "fade-in":    "opacity-0",
    "fade-left":  "-translate-x-8 opacity-0",
    "fade-right": "translate-x-8 opacity-0",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 translate-x-0 opacity-100" : base[animation]} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
