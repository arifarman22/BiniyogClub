"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  total?: number;
  limit?: number;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  showInfo = true,
  total,
  limit,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const from = total && limit ? (page - 1) * limit + 1 : null;
  const to = total && limit ? Math.min(page * limit, total) : null;

  return (
    <div className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}>
      {showInfo && total && from && to ? (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span> results
        </p>
      ) : (
        <div />
      )}

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="flex size-8 items-center justify-center text-muted-foreground">
              <MoreHorizontal className="size-4" />
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(p as number)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
