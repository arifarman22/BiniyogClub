"use client";

import { useState } from "react";
import { getDocumentDownloadUrlAction } from "@/server/actions/document.actions";
import { Download, Loader2 } from "lucide-react";

interface DocumentDownloadButtonProps {
  documentId: string;
  label?: string;
  className?: string;
}

export function DocumentDownloadButton({
  documentId,
  label = "Download",
  className,
}: DocumentDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    const result = await getDocumentDownloadUrlAction(documentId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={
          className ??
          "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
        }
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {label}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
