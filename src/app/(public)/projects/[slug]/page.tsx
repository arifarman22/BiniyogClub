import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Clock, Calendar, AlertCircle, TrendingUp,
  FileText, CheckCircle2, ChevronRight, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/shared/button-link";
import { Button } from "@/components/ui/button";
import { getProjectBySlug, getAllProjectSlugs } from "@/server/data/public.data";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { ProjectInvestForm } from "@/components/shared/project-invest-form";
import { ProjectBankDetails } from "@/components/shared/project-bank-details";
import { ProjectStatusBadge } from "@/components/shared/project-status-badge";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: project.title,
    description: project.description.slice(0, 160),
    openGraph: {
      title: `${project.title} — Biniyog Club`,
      description: project.description.slice(0, 160),
      images: project.coverImageUrl ? [{ url: project.coverImageUrl }] : [],
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate", TRADE_FINANCE: "Trade Finance",
  SME: "SME", TECHNOLOGY: "Technology",
  INFRASTRUCTURE: "Infrastructure", OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  FUNDRAISING: "Open for Investment", FUNDED: "Fully Funded",
  ACTIVE: "In Progress", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  FUNDRAISING: "bg-harvest-100 text-harvest-600 border-harvest-400/30",
  FUNDED: "bg-brand-100 text-brand-700 border-brand-400/30",
  ACTIVE: "bg-brand-100 text-brand-700 border-brand-400/30",
  COMPLETED: "bg-success-muted text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return", PROFIT_SHARE: "Profit Share", HYBRID: "Hybrid",
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General", MILESTONE: "Milestone", ISSUE: "Issue", FINANCIAL_REPORT: "Financial Report",
};

const UPDATE_TYPE_COLORS: Record<string, string> = {
  MILESTONE: "bg-brand-100 text-brand-700",
  FINANCIAL_REPORT: "bg-finance-100 text-finance-600",
  ISSUE: "bg-destructive/10 text-destructive",
  GENERAL: "bg-muted text-muted-foreground",
};

const PROJECT_FAQS = [
  { q: "When will I receive my returns?", a: "Returns are distributed after the project completes. You will receive a notification when funds are credited to your wallet." },
  { q: "Can I withdraw my investment early?", a: "Investments cannot be withdrawn once a project is fully funded and active. You can cancel within 48 hours of committing if the project has not yet reached its funding goal." },
  { q: "What happens if the funding goal is not reached?", a: "If the project does not reach its minimum funding threshold by the deadline, all invested funds are returned to your wallet in full with no fees charged." },
];

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
  if (g === 0) return 0;
  return Math.min(100, Math.round((Number(funded) / g) * 100));
}

function daysLeft(deadline: Date | string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" });
}

function fileSizeLabel(bytes: number) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const [project, session] = await Promise.all([getProjectBySlug(slug), getSession()]);
  if (!project) notFound();

  let kycApproved = false;
  if (session) {
    const kyc = await db.kyc.findUnique({ where: { userId: session.id }, select: { status: true } });
    kycApproved = kyc?.status === "VERIFIED";
  }

  const pct = fundingPct(project.fundedAmountBdt.toString(), project.fundingGoalBdt.toString());
  const remaining = Math.max(0, Number(project.fundingGoalBdt) - Number(project.fundedAmountBdt));
  const days = daysLeft(project.fundingDeadline);
  const isOpen = project.status === "FUNDRAISING";
  const isRunning = project.status === "FUNDED" || project.status === "ACTIVE";
  const isClosed = ["COMPLETED", "CANCELLED"].includes(project.status);
  const canInvestNow = isOpen || isRunning;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brand-900 py-12 text-white">
        {project.coverImageUrl && (
          <div className="pointer-events-none absolute inset-0">
            <Image src={project.coverImageUrl} alt="" fill className="object-cover object-center opacity-20" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 to-brand-900/70" />
          </div>
        )}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-brand-200/70">
            <Link href="/projects" className="hover:text-brand-100">Projects</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-brand-100 line-clamp-1">{project.title}</span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                <Badge className="border-brand-400/40 bg-brand-700/60 text-brand-100">
                  {CATEGORY_LABELS[project.category] ?? project.category}
                </Badge>
                <ProjectStatusBadge status={project.status} size="md" />
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{project.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand-100/80">
                {project.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {project.location}
                  </span>
                )}
                {isOpen && days > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" />
                    {days} days left to invest
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Left */}
            <div className="lg:col-span-2 space-y-10">

              <div>
                <h2 className="mb-4 text-xl font-bold">Overview</h2>
                {project.imageUrls.length > 0 && (
                  <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {project.imageUrls.slice(0, 3).map((url, i) => (
                      <div key={i} className="relative h-36 overflow-hidden rounded-xl">
                        <Image src={url} alt={`${project.title} image ${i + 1}`} fill className="object-cover" sizes="33vw" />
                      </div>
                    ))}
                  </div>
                )}
                {!project.imageUrls.length && project.coverImageUrl && (
                  <div className="mb-5 overflow-hidden rounded-xl">
                    <Image src={project.coverImageUrl} alt={project.title} width={800} height={400} className="w-full h-64 object-cover rounded-xl" />
                  </div>
                )}
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-bold">Financial Information</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Funding Goal", value: formatBdtFull(project.fundingGoalBdt.toString()), sub: "Total target" },
                    { label: "Minimum Funding", value: formatBdtFull(project.fundingMinBdt.toString()), sub: "To activate project" },
                    { label: "Amount Raised", value: formatBdtFull(project.fundedAmountBdt.toString()), sub: `${pct}% of goal` },
                    { label: "Remaining", value: formatBdtFull(remaining), sub: "Still needed" },
                    { label: "Min. Investment", value: formatBdtFull(project.minInvestmentBdt.toString()), sub: "Per investor" },
                    ...(project.maxInvestmentBdt ? [{ label: "Max. Investment", value: formatBdtFull(project.maxInvestmentBdt.toString()), sub: "Per investor" }] : []),
                    { label: "Expected Return", value: `${Number(project.expectedReturnPct.toString()).toFixed(2)}%`, sub: RETURN_TYPE_LABELS[project.returnType] ?? project.returnType },
                    { label: "Duration", value: `${project.durationDays} days`, sub: "From project start" },
                    { label: "Investors", value: project._count.investments.toString(), sub: "Joined so far" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-lg font-bold text-primary">{value}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-bold">Funding Progress</h2>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-2 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-bold text-primary">{pct}%</span>
                      <span className="ml-2 text-sm text-muted-foreground">funded</span>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{formatBdt(project.fundedAmountBdt.toString())} raised</p>
                      <p>of {formatBdt(project.fundingGoalBdt.toString())} goal</p>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-center text-sm">
                    <div><p className="font-semibold">{formatBdt(project.fundedAmountBdt.toString())}</p><p className="text-xs text-muted-foreground">Raised</p></div>
                    <div><p className="font-semibold">{formatBdt(remaining)}</p><p className="text-xs text-muted-foreground">Remaining</p></div>
                    <div><p className="font-semibold">{project._count.investments}</p><p className="text-xs text-muted-foreground">Investors</p></div>
                  </div>
                  {isOpen && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      {days > 0 ? `${days} days remaining to invest` : "Funding closes soon"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-bold">Timeline</h2>
                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  {[
                    { label: "Funding Deadline", date: fmtDate(project.fundingDeadline), icon: <Calendar className="h-4 w-4" />, active: isOpen },
                    { label: "Project Start Date", date: fmtDate(project.startDate), icon: <TrendingUp className="h-4 w-4" />, active: false },
                    { label: "Expected Maturity", date: fmtDate(project.endDate), icon: <CheckCircle2 className="h-4 w-4" />, active: false },
                  ].map(({ label, date, icon, active }) => (
                    <div key={label} className="flex items-center justify-between px-5 py-4">
                      <span className={`flex items-center gap-2 text-sm ${active ? "font-medium text-primary" : "text-muted-foreground"}`}>{icon}{label}</span>
                      <span className="text-sm font-medium">{date ?? "TBD"}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Duration</span>
                    <span className="text-sm font-medium">{project.durationDays} days</span>
                  </div>
                </div>
              </div>

              {project.documents.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Project Documents</h2>
                  <div className="space-y-2">
                    {project.documents.map((doc) => (
                      <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.mimeType} · {fileSizeLabel(doc.sizeBytes)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-primary">Download ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {project.updates.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Project Updates</h2>
                  <div className="space-y-4">
                    {project.updates.map((u) => (
                      <div key={u.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${UPDATE_TYPE_COLORS[u.type] ?? "bg-muted text-muted-foreground"}`}>
                            {UPDATE_TYPE_LABELS[u.type] ?? u.type}
                          </span>
                          {u.publishedAt && <span className="text-xs text-muted-foreground">{fmtDate(u.publishedAt)}</span>}
                        </div>
                        <h3 className="mb-2 font-semibold">{u.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{u.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="mb-4 text-xl font-bold">Risk Information</h2>
                <div className="rounded-xl border border-warning/30 bg-warning-muted p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Investment Risk Disclosure</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        All investments carry inherent risks including market fluctuations and operational challenges.
                        Past performance does not guarantee future results. You may receive less than your invested amount.
                      </p>
                    </div>
                  </div>
                  {project.riskInfo && (
                    <div className="border-t border-warning/20 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Project-Specific Risks</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.riskInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-bold">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {PROJECT_FAQS.map(({ q, a }) => (
                    <div key={q} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold text-sm mb-1.5">{q}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  More questions?{" "}
                  <Link href="/faq" className="text-primary hover:underline">Visit our full FAQ</Link>
                  {" "}or{" "}
                  <Link href="/contact" className="text-primary hover:underline">contact support</Link>.
                </p>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">

              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-brand-700 to-brand-600 px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-100/70">{STATUS_LABELS[project.status] ?? project.status}</p>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatBdt(project.fundedAmountBdt.toString())}
                    <span className="ml-1 text-sm font-normal text-brand-100/80">raised</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-800/50">
                    <div className="h-full rounded-full bg-harvest-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-brand-100/70">{pct}% of {formatBdt(project.fundingGoalBdt.toString())} goal</p>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Min. Investment", value: formatBdt(project.minInvestmentBdt.toString()) },
                      { label: "Expected Return", value: `${Number(project.expectedReturnPct.toString()).toFixed(1)}%` },
                      { label: "Duration", value: `${project.durationDays} days` },
                      { label: "Return Type", value: RETURN_TYPE_LABELS[project.returnType] ?? project.returnType },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-sm font-bold text-primary">{value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {isOpen && (
                    <div className="flex items-center gap-2 rounded-lg bg-harvest-50 border border-harvest-400/30 px-3 py-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-harvest-600" />
                      <p className="text-xs font-medium text-harvest-600">{days > 0 ? `${days} days left to invest` : "Closing very soon"}</p>
                    </div>
                  )}
                  {canInvestNow ? (
                    <ProjectInvestForm
                      project={{
                        id: project.id,
                        title: project.title,
                        minInvestmentBdt: Number(project.minInvestmentBdt),
                        maxInvestmentBdt: project.maxInvestmentBdt ? Number(project.maxInvestmentBdt) : undefined,
                        expectedReturnPct: Number(project.expectedReturnPct),
                        returnType: project.returnType,
                        durationDays: project.durationDays,
                      }}
                      isLoggedIn={!!session}
                      kycApproved={kycApproved}
                      currentPath={`/projects/${slug}`}
                    />
                  ) : isClosed ? (
                    <Button className="w-full" variant="outline" disabled>{STATUS_LABELS[project.status] ?? project.status}</Button>
                  ) : (
                    <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
                      <p className="text-sm font-medium">{STATUS_LABELS[project.status] ?? project.status}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">This project is not currently accepting investments</p>
                    </div>
                  )}
                  <p className="text-center text-xs text-muted-foreground">
                    By investing you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 text-sm font-semibold">Key Dates</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Funding Deadline", value: fmtDate(project.fundingDeadline) },
                      { label: "Project Start", value: fmtDate(project.startDate) },
                      { label: "Expected Maturity", value: fmtDate(project.endDate) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />{label}
                        </span>
                        <span className="font-medium text-right">{value ?? "TBD"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {project.location && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 text-sm font-semibold">Project Info</h3>
                    <div className="space-y-2 text-sm">
                      {project.group && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Group</span>
                          <span className="font-medium text-right text-primary">{project.group.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium text-right">{project.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium text-right">{CATEGORY_LABELS[project.category] ?? project.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Have questions about this project?</p>
                <ButtonLink href="/contact" variant="outline" className="w-full justify-center text-xs">Contact Support</ButtonLink>
              </div>

              {/* Bank details for investors */}
              {project.bankAccounts && project.bankAccounts.length > 0 && (
                <ProjectBankDetails bankAccounts={project.bankAccounts} />
              )}

            </div>

          </div>
        </div>
      </section>
    </>
  );
}
