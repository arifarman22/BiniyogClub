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
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        defaultValue={current}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm outline-none",
          "focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors",
          isPending && "opacity-70",
        )}
      />
      {current && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}
