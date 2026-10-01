import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorDocuments } from "@/server/data/investor.data";
import { documentService } from "@/server/services/document.service";
import { DocumentDownloadButton } from "@/components/shared/document-download-button";
import { DocumentUpload, CATEGORY_LABELS } from "@/components/shared/document-upload";
import { FileText, ShieldCheck, Receipt, BarChart3, Leaf, FolderOpen } from "lucide-react";
import { cn } from "cn";
import type { DocumentCategory } from "@/types/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documents — Dashboard" };

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT:   "bg-muted text-muted-foreground",
  SENT:    "bg-blue-100 text-blue-700",
  SIGNED:  "bg-green-100 text-green-700",
  EXPIRED: "bg-yellow-100 text-yellow-700",
  VOIDED:  "bg-red-100 text-red-600",
};

const KYC_DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID", PASSPORT: "Passport", DRIVING_LICENSE: "Driving License",
  UTILITY_BILL: "Utility Bill", BANK_STATEMENT: "Bank Statement",
  TAX_CERTIFICATE: "Tax Certificate", LAND_DEED: "Land Deed",
};

const CATEGORY_ICONS: Partial<Record<DocumentCategory, React.ReactNode>> = {
  INVESTMENT_AGREEMENT:   <FileText className="h-4 w-4 text-primary" />,
  PAYMENT_RECEIPT:        <Receipt className="h-4 w-4 text-primary" />,
  INVESTMENT_RECEIPT:     <Receipt className="h-4 w-4 text-primary" />,
  DISTRIBUTION_STATEMENT: <BarChart3 className="h-4 w-4 text-primary" />,
  HARVEST_REPORT:         <Leaf className="h-4 w-4 text-primary" />,
  PROJECT_DOCUMENT:       <FolderOpen className="h-4 w-4 text-primary" />,
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default async function DocumentsPage() {
  const session = await requireSession();
  const { contracts, kyc } = await getInvestorDocuments(session);

  // Fetch all documents owned by this investor
  const myDocs = await documentService.getDocumentsByOwner(session, session.id);

  const docsByCategory = myDocs.reduce<Partial<Record<DocumentCategory, typeof myDocs>>>((acc, doc) => {
    const cat = (doc as unknown as { category: DocumentCategory }).category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(doc);
    return acc;
  }, {});

  const uploadableCategories: DocumentCategory[] = ["PAYMENT_RECEIPT", "INVESTMENT_RECEIPT", "FARM_DOCUMENT"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">Your investment agreements, receipts, KYC documents, and more</p>
      </div>

      {/* ── Investment Contracts ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4 text-primary" /> Investment Contracts
        </h2>
        {contracts.length > 0 ? (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.investment.project.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>৳{Number(c.investment.amountBdt).toLocaleString()}</span>
                    <span>·</span>
                    <span>Created {fmtDate(c.createdAt)}</span>
                    {c.signedAt && <><span>·</span><span className="text-green-600">Signed {fmtDate(c.signedAt)}</span></>}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-3 shrink-0">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", CONTRACT_STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground")}>
                    {c.status}
                  </span>
                  {c.contractUrl && <DocumentDownloadButton documentId={c.id} label="Download" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No contracts yet. Contracts are generated when you invest." />
        )}
      </section>

      {/* ── KYC Documents ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" /> KYC Documents
        </h2>
        {kyc ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
              <div className="flex-1">
                <p className="font-medium">KYC Verification</p>
                <p className="text-xs text-muted-foreground">
                  {kyc.submittedAt ? `Submitted ${fmtDate(kyc.submittedAt)}` : "Not submitted"}
                  {kyc.reviewedAt && ` · Reviewed ${fmtDate(kyc.reviewedAt)}`}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {kyc.status.replace(/_/g, " ")}
              </span>
            </div>
            {kyc.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{KYC_DOC_LABELS[doc.documentType] ?? doc.documentType}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {fmtDate(doc.createdAt)}
                    {doc.verifiedAt && <span className="text-green-600"> · Verified</span>}
                  </p>
                </div>
                <a
                  href={`/api/kyc/documents/${doc.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/50 hover:text-primary"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No KYC submission found.">
            <a href="/dashboard/kyc" className="mt-2 inline-block text-sm text-primary hover:underline">Complete KYC →</a>
          </EmptyState>
        )}
      </section>

      {/* ── Other document categories ── */}
      {(["PAYMENT_RECEIPT", "INVESTMENT_RECEIPT", "DISTRIBUTION_STATEMENT", "HARVEST_REPORT", "PROJECT_DOCUMENT"] as DocumentCategory[]).map((cat) => {
        const docs = docsByCategory[cat] ?? [];
        return (
          <section key={cat}>
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}s
            </h2>
            {docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtSize(doc.sizeBytes)} · {fmtDate(doc.createdAt)}
                      </p>
                    </div>
                    <DocumentDownloadButton documentId={doc.id} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message={`No ${CATEGORY_LABELS[cat].toLowerCase()}s found.`} />
            )}
          </section>
        );
      })}

      {/* ── Upload section ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <FolderOpen className="h-4 w-4 text-primary" /> Upload a Document
        </h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <DocumentUpload
            category="PAYMENT_RECEIPT"
            entityType="USER"
            entityId={session.id}
            allowedCategories={uploadableCategories}
          />
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
