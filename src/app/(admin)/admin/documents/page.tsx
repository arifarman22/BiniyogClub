import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminDocuments } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtDate } from "@/lib/admin/utils";
import { FileText, Lock, Globe } from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Documents — Admin" };

const ENTITY_OPTIONS = [
  { value: "USER", label: "User" }, { value: "KYC", label: "KYC" },
  { value: "PROJECT", label: "Project" }, { value: "FARM", label: "Farm" },
  { value: "INVESTMENT", label: "Investment" }, { value: "CONTRACT", label: "Contract" },
  { value: "HARVEST", label: "Harvest" }, { value: "EXPENSE", label: "Expense" },
  { value: "FIELD_VISIT", label: "Field Visit" },
];

export default async function AdminDocumentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const entityType = typeof sp.entityType === "string" ? sp.entityType : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminDocuments(session, { search, entityType, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" description={`${total} documents`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search name, uploader..." className="w-64" />
        <AdminFilterBar paramName="entityType" options={ENTITY_OPTIONS} allLabel="All Types" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No documents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Uploader</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Visibility</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="font-medium line-clamp-1">{d.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{d.mimeType}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{d.entityType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{d.uploader.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{(d.sizeBytes / 1024).toFixed(0)} KB</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {d.isPublic ? (
                          <><Globe className="h-3.5 w-3.5" /> Public</>
                        ) : (
                          <><Lock className="h-3.5 w-3.5" /> Private</>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(d.createdAt)}</span>
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
