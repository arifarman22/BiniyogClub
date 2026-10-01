"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

interface FilterOption { value: string; label: string; }

interface ReportFilterBarProps {
  statusOptions?:   FilterOption[];
  categoryOptions?: FilterOption[];
  showDateRange?:   boolean;
  showSearch?:      boolean;
  searchPlaceholder?: string;
}

export function ReportFilterBar({
  statusOptions,
  categoryOptions,
  showDateRange = true,
  showSearch    = false,
  searchPlaceholder = "Search...",
}: ReportFilterBarProps) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const get = (k: string) => searchParams.get(k) ?? "";

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearAll = () => router.push(pathname);

  const hasFilters = ["dateFrom", "dateTo", "status", "category", "search"].some((k) => searchParams.has(k));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showDateRange && (
        <>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={get("dateFrom")}
              onChange={(e) => update("dateFrom", e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={get("dateTo")}
              onChange={(e) => update("dateTo", e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </>
      )}

      {statusOptions && (
        <select
          value={get("status")}
          onChange={(e) => update("status", e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {categoryOptions && (
        <select
          value={get("category")}
          onChange={(e) => update("category", e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={get("search")}
            onChange={(e) => update("search", e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-lg border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-48"
          />
        </div>
      )}

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}
