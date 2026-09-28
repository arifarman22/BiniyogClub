"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
}

export function AdminPagination({ page, totalPages, total, limit = 20 }: AdminPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function href(p: number) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <Link
          href={href(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded border border-border bg-card hover:bg-muted transition-colors",
            page <= 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
        <span className="px-2 text-xs">
          {page} / {totalPages}
        </span>
        <Link
          href={href(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded border border-border bg-card hover:bg-muted transition-colors",
            page >= totalPages && "pointer-events-none opacity-40",
          )}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
