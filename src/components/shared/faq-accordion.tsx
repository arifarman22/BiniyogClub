"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  { q: "What is the minimum investment amount?", a: "You can start investing from as little as ৳5,000. Each project sets its own minimum, clearly displayed on the listing." },
  { q: "How are projects verified?", a: "All projects are created and reviewed by our admin team before listing. They undergo financial due diligence and approval before going live." },
  { q: "What returns can I expect?", a: "Returns vary by project type and duration. All expected returns are shown before you invest — no surprises." },
  { q: "How do I withdraw my returns?", a: "Returns are credited to your Biniyog Club wallet after project completion. Withdraw to your bank account or mobile banking anytime." },
  { q: "Is my investment legally protected?", a: "Yes. Every investment is backed by a signed digital contract. All agreements are legally enforceable." },
  { q: "How does the payment process work?", a: "Pay via bank transfer or mobile banking. Upload your payment proof and our finance team verifies and confirms your investment." },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQS.map(({ q, a }, i) => (
        <div
          key={q}
          className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/25"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center gap-3 p-5 text-left"
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 text-sm font-bold">{q}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <p className="px-5 pb-5 pl-12 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
