"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { HOME_FAQS } from "@/components/shared/faq-data";

interface FaqAccordionProps {
  items?: { q: string; a: string }[];
}

export function FaqAccordion({ items = HOME_FAQS }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={q}>
            <h3 className="m-0 text-base">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center gap-4 py-5 text-left"
              >
                <span
                  className={`flex-1 text-sm font-semibold transition-colors sm:text-base ${isOpen ? "text-primary" : "text-foreground group-hover:text-primary"}`}
                >
                  {q}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center border transition-all duration-300 ${isOpen ? "rotate-45 border-primary bg-primary text-white" : "border-border text-muted-foreground group-hover:border-primary group-hover:text-primary"}`}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={`grid transition-all duration-300 motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-11 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
