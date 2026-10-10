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

  function href(p: number) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Link
            href={href(page - 1)}
            aria-disabled={page <= 1}
            aria-label="Previous page"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-primary/40 hover:text-primary",
              page <= 1 && "pointer-events-none opacity-40",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
          <span className="rounded-xl bg-muted/60 px-3 py-2 text-xs font-semibold tabular-nums text-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={href(page + 1)}
            aria-disabled={page >= totalPages}
            aria-label="Next page"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-primary/40 hover:text-primary",
              page >= totalPages && "pointer-events-none opacity-40",
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
