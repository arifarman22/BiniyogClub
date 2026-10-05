"use client";

import { useState } from "react";
import { getDocumentDownloadUrlAction } from "@/server/actions/document.actions";

interface DownloadCertificateButtonProps {
  documentId: string;
}

export function DownloadCertificateButton({ documentId }: DownloadCertificateButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    const result = await getDocumentDownloadUrlAction(documentId);
    setLoading(false);
    if (result.success) {
      window.open(result.data.url, "_blank");
    } else {
      alert(result.error ?? "Failed to get download link");
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/40 disabled:opacity-60 transition-colors"
    >
      {loading ? (
        <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
        </svg>
      )}
      {loading ? "Loading…" : "Certificate"}
    </button>
  );
}
