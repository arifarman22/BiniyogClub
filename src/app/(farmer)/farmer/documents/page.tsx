import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerDocuments } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Documents — Farmer Portal" };

const ENTITY_LABEL: Record<string, string> = {
  PROJECT: "Project", FARM: "Farm", KYC: "KYC",
  INVESTMENT: "Investment", CONTRACT: "Contract",
};

export default async function FarmerDocumentsPage() {
  const session = await requireSession();
  const documents = await getFarmerDocuments(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description={`${documents.length} document${documents.length !== 1 ? "s" : ""}`}
      />

      {documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No documents"
            description="Documents related to your farms and projects will appear here"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ul className="divide-y divide-border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ENTITY_LABEL[doc.entityType] ?? doc.entityType}
                      {" · "}
                      {(doc.sizeBytes / 1024).toFixed(0)} KB
                      {" · "}
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                {doc.isPublic && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
