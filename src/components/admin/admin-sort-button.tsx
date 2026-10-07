"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSortButtonProps {
  column: string;
  label: string;
  className?: string;
}

export function AdminSortButton({ column, label, className }: AdminSortButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "";
  const currentOrder = searchParams.get("order") ?? "desc";
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc";

  function handleClick() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("sort", column);
    sp.set("order", nextOrder);
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        isPending && "opacity-60",
        className,
      )}
    >
      {label}
      {isActive ? (
        currentOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
