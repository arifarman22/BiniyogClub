"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Download, Loader2, ChevronDown } from "lucide-react";

interface ExportButtonProps {
  reportType: string;
  label?:     string;
  formats?:   ("csv" | "excel")[];
}

export function ExportButton({
  reportType,
  label   = "Export",
  formats = ["csv", "excel"],
}: ExportButtonProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen]       = useState(false);

  async function handleExport(format: string) {
    setLoading(format);
    setOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("type",   reportType);
    params.set("format", format);

    // Trigger download — browser handles the file, no data in JS memory
    const a = document.createElement("a");
    a.href  = `/api/reports/export?${params.toString()}`;
    a.click();

    // Give the browser a moment to start the download
    setTimeout(() => setLoading(null), 2000);
  }

  if (formats.length === 1) {
    return (
      <button
        onClick={() => handleExport(formats[0])}
        disabled={!!loading}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {label}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!loading}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {label}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {formats.map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                {fmt === "csv" ? "CSV" : "Excel (.xlsx)"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
