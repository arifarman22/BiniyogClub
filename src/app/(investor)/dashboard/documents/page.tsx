import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorDocuments } from "@/server/data/investor.data";
import { FileText, ShieldCheck, Download } from "lucide-react";
import { cn } from "cn";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documents — Dashboard" };

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT:   "bg-muted text-muted-foreground",
  SENT:    "bg-info-muted text-info-foreground",
  SIGNED:  "bg-success-muted text-success",
  EXPIRED: "bg-warning-muted text-warning-foreground",
  VOIDED:  "bg-destructive/10 text-destructive",
};

const KYC_DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID", PASSPORT: "Passport", DRIVING_LICENSE: "Driving License",
  UTILITY_BILL: "Utility Bill", BANK_STATEMENT: "Bank Statement",
  TAX_CERTIFICATE: "Tax Certificate", LAND_DEED: "Land Deed",
};

const KYC_STATUS_COLORS: Record<string, string> = {
  NOT_SUBMITTED: "bg-muted text-muted-foreground",
  PENDING:       "bg-warning-muted text-warning-foreground",
  UNDER_REVIEW:  "bg-info-muted text-info-foreground",
  APPROVED:      "bg-success-muted text-success",
  REJECTED:      "bg-destructive/10 text-destructive",
  EXPIRED:       "bg-warning-muted text-warning-foreground",
};

export default async function DocumentsPage() {
  const session = await requireSession();
  const { contracts, kyc } = await getInvestorDocuments(session);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">Your investment contracts and KYC documents</p>
      </div>

      {/* Investment contracts */}
      <div>
        <h2 className="mb-4 font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Investment Contracts
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
                    <span>Created {new Date(c.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {c.signedAt && (
                      <>
                        <span>·</span>
                        <span className="text-success">Signed {new Date(c.signedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-3 shrink-0">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", CONTRACT_STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground")}>
                    {c.status}
                  </span>
                  {c.contractUrl && (
                    <a
                      href={c.contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary/50 hover:text-primary"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">No contracts yet. Contracts are generated when you invest.</p>
          </div>
        )}
      </div>

      {/* KYC documents */}
      <div>
        <h2 className="mb-4 font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          KYC Documents
        </h2>
        {kyc ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
              <div className="flex-1">
                <p className="font-medium">KYC Verification</p>
                <p className="text-xs text-muted-foreground">
                  {kyc.submittedAt
                    ? `Submitted ${new Date(kyc.submittedAt).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Not submitted"}
                  {kyc.reviewedAt && ` · Reviewed ${new Date(kyc.reviewedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", KYC_STATUS_COLORS[kyc.status] ?? "bg-muted text-muted-foreground")}>
                {kyc.status.replace("_", " ")}
              </span>
            </div>

            {kyc.documents.length > 0 && (
              <div className="space-y-2">
                {kyc.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{KYC_DOC_LABELS[doc.documentType] ?? doc.documentType}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(doc.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                        {doc.verifiedAt && <span className="text-success"> · Verified</span>}
                      </p>
                    </div>
                    <a
                      href={doc.storageKey}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary/50 hover:text-primary"
                    >
                      <Download className="h-3 w-3" />
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">No KYC submission found.</p>
            <a href="/dashboard/kyc" className="mt-3 inline-block text-sm text-primary hover:underline">
              Complete KYC →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
