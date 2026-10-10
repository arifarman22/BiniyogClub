export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminDocuments } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { DocumentDownloadButton } from "@/components/shared/document-download-button";
import { fmtDate } from "@/lib/admin/utils";
import { FileText, Lock, Globe, ShieldAlert } from "lucide-react";
import { cn } from "cn";
import type { AsyncComponentProps } from "@/types";
import type { DocumentCategory } from "@/types/prisma";

export const metadata: Metadata = { title: "Documents — Admin" };

const CATEGORY_OPTIONS = [
  { value: "KYC",                    label: "KYC" },
  { value: "PROJECT_DOCUMENT",       label: "Project Document" },
  { value: "INVESTMENT_AGREEMENT",   label: "Investment Agreement" },
  { value: "PAYMENT_RECEIPT",        label: "Payment Receipt" },
  { value: "INVESTMENT_RECEIPT",     label: "Investment Receipt" },
  { value: "DISTRIBUTION_STATEMENT", label: "Distribution Statement" },
  { value: "HARVEST_REPORT",         label: "Harvest Report" },
  { value: "FARM_DOCUMENT",          label: "Farm Document" },
];

const ENTITY_OPTIONS = [
  { value: "USER",       label: "User" },
  { value: "KYC",        label: "KYC" },
  { value: "PROJECT",    label: "Project" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "CONTRACT",   label: "Contract" },
];

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  KYC:                    "bg-blue-100 text-blue-700",
  PROJECT_DOCUMENT:       "bg-purple-100 text-purple-700",
  INVESTMENT_AGREEMENT:   "bg-orange-100 text-orange-700",
  PAYMENT_RECEIPT:        "bg-green-100 text-green-700",
  INVESTMENT_RECEIPT:     "bg-teal-100 text-teal-700",
  DISTRIBUTION_STATEMENT: "bg-indigo-100 text-indigo-700",
  HARVEST_REPORT:         "bg-lime-100 text-lime-700",
  FARM_DOCUMENT:          "bg-yellow-100 text-yellow-700",
};

export default async function AdminDocumentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search     = typeof sp.search     === "string" ? sp.search     : "";
  const entityType = typeof sp.entityType === "string" ? sp.entityType : "";
  const category   = typeof sp.category   === "string" ? sp.category   : "";
  const page       = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminDocuments(session, { search, entityType, category, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" description={`${total} documents`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search name, uploader..." className="w-64" />
        <AdminFilterBar paramName="category"   options={CATEGORY_OPTIONS} allLabel="All Categories" />
        <AdminFilterBar paramName="entityType" options={ENTITY_OPTIONS}   allLabel="All Entities" />
      </div>

      <div className="surface-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No documents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Uploader</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Uploaded</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((d) => (
                  <tr key={d.id} className="hover:bg-primary/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium line-clamp-1">{d.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground">{d.mimeType}</span>
                            {d.isFinalized && (
                              <span className="flex items-center gap-0.5 text-xs text-orange-600">
                                <ShieldAlert className="h-3 w-3" /> Finalized
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", CATEGORY_COLORS[d.category as DocumentCategory] ?? "bg-muted text-muted-foreground")}>
                        {d.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{d.entityType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{d.uploader.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{(d.sizeBytes / 1024).toFixed(0)} KB</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {d.isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        {fmtDate(d.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DocumentDownloadButton documentId={d.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
