"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSearchBarProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
}

export function AdminSearchBar({
  placeholder = "Search...",
  paramName = "search",
  className,
}: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const current = searchParams.get(paramName) ?? "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value ?? "";
    const sp = new URLSearchParams(searchParams.toString());
    if (value) {
      sp.set(paramName, value);
    } else {
      sp.delete(paramName);
    }
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(paramName);
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        defaultValue={current}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border border-border/70 bg-card pl-10 pr-9 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none placeholder:text-muted-foreground/70",
          "focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all",
          isPending && "opacity-70",
        )}
      />
      {current && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}
