import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Pencil, MapPin, Calendar, Users, TrendingUp,
  FileText, Building2, Clock, ExternalLink, CreditCard, ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { db } from "@/lib/db/prisma";
import { getAdminProjectById } from "@/server/data/admin.data";
import { ProjectStatusTransition } from "@/components/admin/project-status-transition";
import type { ProjectStatus } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  return { title: project ? `${project.title} — Admin` : "Project Not Found" };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved",
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  PENDING_APPROVAL: "bg-warning/10 text-warning border-warning/30",
  APPROVED: "bg-info/10 text-info border-info/30",
  FUNDRAISING: "bg-harvest-100 text-harvest-600 border-harvest-400/30",
  FUNDED: "bg-brand-100 text-brand-700 border-brand-400/30",
  ACTIVE: "bg-brand-100 text-brand-700 border-brand-400/30",
  COMPLETED: "bg-success/10 text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate", TRADE_FINANCE: "Trade Finance",
  SME: "SME", TECHNOLOGY: "Technology",
  INFRASTRUCTURE: "Infrastructure", OTHER: "Other",
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock",
  AQUACULTURE: "Aquaculture", POULTRY: "Poultry",
  DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing",
};

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return", PROFIT_SHARE: "Profit Share", HYBRID: "Hybrid",
};

const INV_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PAYMENT_PENDING: "bg-warning/10 text-warning",
  ACTIVE: "bg-brand-100 text-brand-700",
  MATURED: "bg-success/10 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  COMPLETED: "bg-success/10 text-success",
  REFUNDED: "bg-muted text-muted-foreground",
};

function formatBdt(n: number | string) {
  const v = Number(n);
  if (v >= 10000000) return `৳${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `৳${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

function formatBdtFull(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fundingPct(funded: number | string, goal: number | string) {
  const g = Number(goal);
  if (!g) return 0;
  return Math.min(100, Math.round((Number(funded) / g) * 100));
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  if (!project) notFound();

  // Fetch investments for this project
  const investments = await db.investment.findMany({
    where: { projectId: id },
    select: {
      id: true, status: true, amountBdt: true, expectedReturnBdt: true,
      receiptNumber: true, createdAt: true, activatedAt: true,
      investorProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pct = fundingPct(project.fundedAmountBdt.toString(), project.fundingGoalBdt.toString());
  const totalInvested = investments
    .filter((i) => !["CANCELLED", "REFUNDED"].includes(i.status))
    .reduce((s, i) => s + Number(i.amountBdt), 0);

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/admin/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          {["FUNDRAISING", "FUNDED", "ACTIVE", "COMPLETED"].includes(project.status) && (
            <Link
              href={`/projects/${project.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Public Page
            </Link>
          )}
          <Link href={`/admin/projects/${id}/edit`} className={cn(buttonVariants({ size: "sm" }))}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Project
          </Link>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        {project.coverImageUrl ? (
          <div className="relative h-56 w-full">
            <Image src={project.coverImageUrl} alt={project.title} fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground")}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                <Badge variant="secondary" className="text-xs bg-black/40 text-white border-white/20">
                  {CATEGORY_LABELS[project.category] ?? project.category}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-white/70">
                {project.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.location}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Deadline: {fmtDate(project.fundingDeadline)}
                </span>
                {project.manager && (
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{project.manager.name}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground")}>
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[project.category] ?? project.category}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {project.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.location}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Deadline: {fmtDate(project.fundingDeadline)}</span>
              {project.manager && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{project.manager.name}</span>}
            </div>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Funding Goal", value: formatBdt(project.fundingGoalBdt.toString()) },
          { label: "Amount Raised", value: formatBdt(project.fundedAmountBdt.toString()), highlight: true },
          { label: "Progress", value: `${pct}%` },
          { label: "Investors", value: project._count.investments.toString() },
          { label: "Expected Return", value: `${Number(project.expectedReturnPct).toFixed(1)}%` },
          { label: "Duration", value: `${project.durationDays} days` },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={cn("text-lg font-bold", highlight ? "text-primary" : "text-foreground")}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: 2 cols */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-semibold">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
          </div>

          {/* Image gallery */}
          {project.imageUrls.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" /> Media ({project.imageUrls.length})
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {project.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg border border-border">
                    <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="200px" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Financial details */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">Financial Details</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Funding Goal", value: formatBdtFull(project.fundingGoalBdt.toString()) },
                { label: "Min. Funding", value: formatBdtFull(project.fundingMinBdt.toString()) },
                { label: "Amount Raised", value: formatBdtFull(project.fundedAmountBdt.toString()) },
                { label: "Min. Investment", value: formatBdtFull(project.minInvestmentBdt.toString()) },
                ...(project.maxInvestmentBdt ? [{ label: "Max. Investment", value: formatBdtFull(project.maxInvestmentBdt.toString()) }] : []),
                { label: "Expected Return", value: `${Number(project.expectedReturnPct).toFixed(2)}%` },
                { label: "Return Type", value: RETURN_TYPE_LABELS[project.returnType] ?? project.returnType },
                { label: "Duration", value: `${project.durationDays} days` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-primary mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Funding progress */}
            <div className="mt-5 pt-5 border-t border-border">
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-medium">{pct}% funded</span>
                <span className="text-muted-foreground">{formatBdt(project.fundedAmountBdt.toString())} of {formatBdt(project.fundingGoalBdt.toString())}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Timeline
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Funding Deadline", value: fmtDate(project.fundingDeadline) },
                { label: "Project Start", value: fmtDate(project.startDate) },
                { label: "Expected End", value: fmtDate(project.endDate) },
                { label: "Created", value: fmtDate(project.createdAt) },
                { label: "Approved", value: fmtDate(project.approvedAt) },
                { label: "Published", value: fmtDate(project.publishedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk info */}
          {project.riskInfo && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
              <h2 className="mb-3 font-semibold text-warning">Risk Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.riskInfo}</p>
            </div>
          )}

          {/* Investments table */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Investments ({investments.length})
              </h2>
              <Link href={`/admin/investments?project=${id}`} className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>
            {investments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Investor</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                      <th className="pb-2 text-center font-medium">Status</th>
                      <th className="pb-2 text-right font-medium hidden sm:table-cell">Receipt</th>
                      <th className="pb-2 text-right font-medium hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-xs">{inv.investorProfile.user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{inv.investorProfile.user.email}</p>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-xs text-primary">
                          {formatBdtFull(inv.amountBdt.toString())}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", INV_STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
                            {inv.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-[10px] text-muted-foreground hidden sm:table-cell">
                          {inv.receiptNumber ?? "—"}
                        </td>
                        <td className="py-2.5 text-right text-[10px] text-muted-foreground hidden md:table-cell">
                          {fmtDate(inv.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td className="pt-3 text-xs font-semibold">Total Active</td>
                      <td className="pt-3 text-right text-xs font-bold text-primary">{formatBdtFull(totalInvested)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No investments yet.</p>
            )}
          </div>

          {/* Bank accounts */}
          {project.bankAccounts.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" /> Bank Accounts ({project.bankAccounts.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {project.bankAccounts.map((acc) => (
                  <div key={acc.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
                    <p className="font-semibold">{acc.bankName}</p>
                    <p className="text-muted-foreground">{acc.accountName}</p>
                    <p className="font-mono text-xs">{acc.accountNumber}</p>
                    {acc.branchName && <p className="text-xs text-muted-foreground">Branch: {acc.branchName}</p>}
                    {acc.routingNumber && <p className="text-xs text-muted-foreground">Routing: {acc.routingNumber}</p>}
                    {acc.mobileNumber && <p className="text-xs text-muted-foreground">Mobile: {acc.mobileNumber}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updates */}
          {project.updates.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold">Project Updates</h2>
              <div className="space-y-3">
                {project.updates.map((u) => (
                  <div key={u.id} className="rounded-lg border border-border p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{u.type.replace(/_/g, " ")}</Badge>
                      {u.publishedAt && <span className="text-xs text-muted-foreground">{fmtDate(u.publishedAt)}</span>}
                    </div>
                    <p className="text-sm font-medium">{u.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{u.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Status transition */}
          <ProjectStatusTransition projectId={project.id} currentStatus={project.status as ProjectStatus} />

          {/* Funding summary */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Funding Summary</h3>
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-primary">{pct}%</span>
                <span className="text-muted-foreground">{formatBdt(project.fundedAmountBdt.toString())} raised</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Goal: {formatBdt(project.fundingGoalBdt.toString())}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Return", value: `${Number(project.expectedReturnPct).toFixed(1)}%` },
                { label: "Duration", value: `${project.durationDays}d` },
                { label: "Min Invest", value: formatBdt(project.minInvestmentBdt.toString()) },
                { label: "Investors", value: project._count.investments.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 p-2.5 text-center">
                  <p className="text-sm font-semibold text-primary">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Project info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Project Info</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Category", value: CATEGORY_LABELS[project.category] ?? project.category },
                { label: "Return Type", value: RETURN_TYPE_LABELS[project.returnType] ?? project.returnType },
                { label: "Location", value: project.location ?? "—" },
                { label: "Manager", value: project.manager?.name ?? "—" },
                { label: "Group", value: project.group?.name ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit trail */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Audit Trail</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                { label: "Created", value: fmtDate(project.createdAt) },
                { label: "Updated", value: fmtDate(project.updatedAt) },
                ...(project.approvedAt ? [{ label: "Approved", value: fmtDate(project.approvedAt) }] : []),
                ...(project.publishedAt ? [{ label: "Published", value: fmtDate(project.publishedAt) }] : []),
                ...(project.completedAt ? [{ label: "Completed", value: fmtDate(project.completedAt) }] : []),
                ...(project.cancelledAt ? [{ label: "Cancelled", value: fmtDate(project.cancelledAt) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
              {project.cancellationReason && (
                <p className="rounded bg-muted/50 p-2">{project.cancellationReason}</p>
              )}
              {project.rejectionReason && (
                <p className="rounded bg-destructive/10 p-2 text-destructive">{project.rejectionReason}</p>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
            <Link href={`/admin/investments?project=${id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2")}>
              <TrendingUp className="h-3.5 w-3.5" /> View Investments
            </Link>
            <Link href={`/admin/documents?entityId=${id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2")}>
              <FileText className="h-3.5 w-3.5" /> View Documents
            </Link>
            <Link href={`/admin/projects/${id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2")}>
              <Pencil className="h-3.5 w-3.5" /> Edit Project
            </Link>
            {["FUNDRAISING", "FUNDED", "ACTIVE", "COMPLETED"].includes(project.status) && (
              <Link href={`/projects/${project.slug}`} target="_blank" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2")}>
                <ExternalLink className="h-3.5 w-3.5" /> Public Page
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
