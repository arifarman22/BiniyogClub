"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdminFilterBarProps {
  paramName?: string;
  options: FilterOption[];
  allLabel?: string;
}

export function AdminFilterBar({
  paramName = "status",
  options,
  allLabel = "All",
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get(paramName) ?? "";

  function select(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) {
      sp.set(paramName, value);
    } else {
      sp.delete(paramName);
    }
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  const all = [{ value: "", label: allLabel }, ...options];

  return (
    <div className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/50 p-1", isPending && "opacity-70")}>
      {all.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => select(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            current === opt.value
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              current === opt.value ? "bg-primary/10 text-primary" : "bg-background/80",
            )}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
