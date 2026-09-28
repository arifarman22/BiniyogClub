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
    <div className={cn("flex flex-wrap gap-1.5", isPending && "opacity-70")}>
      {all.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => select(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            current === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              current === opt.value ? "bg-primary-foreground/20" : "bg-muted",
            )}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
