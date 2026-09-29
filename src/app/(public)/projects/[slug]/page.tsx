import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Clock, Calendar, AlertCircle, TrendingUp,
  Users, FileText, CheckCircle2, ChevronRight, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/shared/button-link";
import { Button } from "@/components/ui/button";
import { getProjectBySlug, getAllProjectSlugs } from "@/server/data/public.data";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { getActiveBankAccounts } from "@/server/data/manual-payment.data";
import { ProjectInvestForm } from "@/components/shared/project-invest-form";

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
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  FUNDRAISING: "Open for Investment", FUNDED: "Fully Funded",
  ACTIVE: "In Progress", HARVESTING: "Harvesting", SOLD: "Sold",
  PROFIT_CALCULATION: "Calculating Profits", DISTRIBUTION: "Distributing Returns",
  COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  FUNDRAISING: "bg-harvest-100 text-harvest-600 border-harvest-400/30",
  FUNDED: "bg-brand-100 text-brand-700 border-brand-400/30",
  ACTIVE: "bg-brand-100 text-brand-700 border-brand-400/30",
  HARVESTING: "bg-finance-100 text-finance-600 border-finance-500/30",
  SOLD: "bg-finance-100 text-finance-600 border-finance-500/30",
  PROFIT_CALCULATION: "bg-finance-100 text-finance-600 border-finance-500/30",
  DISTRIBUTION: "bg-finance-100 text-finance-600 border-finance-500/30",
  COMPLETED: "bg-success-muted text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return", PROFIT_SHARE: "Profit Share", HYBRID: "Hybrid",
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General", MILESTONE: "Milestone", ISSUE: "Issue",
  HARVEST_REPORT: "Harvest Report", FINANCIAL_REPORT: "Financial Report",
  FIELD_VISIT_REPORT: "Field Visit",
};

const UPDATE_TYPE_COLORS: Record<string, string> = {
  MILESTONE: "bg-brand-100 text-brand-700",
  HARVEST_REPORT: "bg-harvest-100 text-harvest-600",
  FINANCIAL_REPORT: "bg-finance-100 text-finance-600",
  FIELD_VISIT_REPORT: "bg-muted text-muted-foreground",
  ISSUE: "bg-destructive/10 text-destructive",
  GENERAL: "bg-muted text-muted-foreground",
};

const PROJECT_FAQS = [
  {
    q: "When will I receive my returns?",
    a: "Returns are distributed after the crop is harvested and sold. You will receive a notification when funds are credited to your wallet.",
  },
  {
    q: "Can I withdraw my investment early?",
    a: "Investments cannot be withdrawn once a project is fully funded and active. You can cancel within 48 hours of committing if the project has not yet reached its funding goal.",
  },
  {
    q: "How is the farm verified?",
    a: "Every farm undergoes identity verification, land ownership checks, and an in-person assessment by our certified field officers before any project is listed.",
  },
  {
    q: "What happens if the funding goal is not reached?",
    a: "If the project does not reach its minimum funding threshold by the deadline, all invested funds are returned to your wallet in full with no fees charged.",
  },
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
  return new Date(d).toLocaleDateString("en-BD", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function fileSizeLabel(bytes: number) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const [project, session] = await Promise.all([
    getProjectBySlug(slug),
    getSession(),
  ]);
  if (!project) notFound();

  let kycApproved = false;
  if (session) {
    const kyc = await db.kyc.findUnique({
      where: { userId: session.id },
      select: { status: true },
    });
    kycApproved = kyc?.status === "VERIFIED";
  }

  const pct = fundingPct(project.fundedAmountBdt.toString(), project.fundingGoalBdt.toString());
  const remaining = Math.max(0, Number(project.fundingGoalBdt.toString()) - Number(project.fundedAmountBdt.toString()));
  const days = daysLeft(project.fundingDeadline);
  const isOpen = project.status === "FUNDRAISING";
  const isClosed = ["COMPLETED", "CANCELLED"].includes(project.status);
  const farmer = project.farm.farmerProfile;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-brand-900 py-12 text-white">
        {project.coverImageUrl && (
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={project.coverImageUrl}
              alt=""
              fill
              className="object-cover object-center opacity-20"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 to-brand-900/70" />
          </div>
        )}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
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
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{project.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand-100/80">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {project.location ?? `${project.farm.district}, ${project.farm.division}`}
                </span>
                {farmer && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 shrink-0" />
                    {farmer.user.name}
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

      {/* ── Body ── */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* ── Left: main content ── */}
            <div className="lg:col-span-2 space-y-10">

              {/* ── 1. Overview ── */}
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
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>

              {/* ── 2. Financial Information ── */}
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

              {/* ── 3. Funding Progress ── */}
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
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-center text-sm">
                    <div>
                      <p className="font-semibold">{formatBdt(project.fundedAmountBdt.toString())}</p>
                      <p className="text-xs text-muted-foreground">Raised</p>
                    </div>
                    <div>
                      <p className="font-semibold">{formatBdt(remaining)}</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                    <div>
                      <p className="font-semibold">{project._count.investments}</p>
                      <p className="text-xs text-muted-foreground">Investors</p>
                    </div>
                  </div>
                  {isOpen && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      {days > 0 ? `${days} days remaining to invest` : "Funding closes soon"}
                    </p>
                  )}
                </div>
              </div>

              {/* ── 4. Timeline ── */}
              <div>
                <h2 className="mb-4 text-xl font-bold">Timeline</h2>
                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  {[
                    { label: "Funding Deadline", date: fmtDate(project.fundingDeadline), icon: <Calendar className="h-4 w-4" />, active: isOpen },
                    { label: "Project Start Date", date: fmtDate(project.startDate), icon: <TrendingUp className="h-4 w-4" />, active: false },
                    { label: "Expected Maturity", date: fmtDate(project.endDate), icon: <CheckCircle2 className="h-4 w-4" />, active: false },
                  ].map(({ label, date, icon, active }) => (
                    <div key={label} className="flex items-center justify-between px-5 py-4">
                      <span className={`flex items-center gap-2 text-sm ${active ? "font-medium text-primary" : "text-muted-foreground"}`}>
                        {icon}
                        {label}
                      </span>
                      <span className="text-sm font-medium">{date ?? "TBD"}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Duration
                    </span>
                    <span className="text-sm font-medium">{project.durationDays} days</span>
                  </div>
                </div>
              </div>

              {/* ── 5. Agricultural Details ── */}
              <div>
                <h2 className="mb-4 text-xl font-bold">Agricultural Details</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Farm Name", value: project.farm.name },
                    { label: "Location", value: `${project.farm.district}, ${project.farm.division}` },
                    { label: "Total Farm Area", value: `${Number(project.farm.totalAreaAcres.toString()).toFixed(2)} acres` },
                    { label: "Category", value: CATEGORY_LABELS[project.category] ?? project.category },
                    { label: "Return Type", value: RETURN_TYPE_LABELS[project.returnType] ?? project.returnType },
                    { label: "Project Status", value: STATUS_LABELS[project.status] ?? project.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-0.5 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 6. Farmer Information ── */}
              {farmer && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Farmer Information</h2>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xl font-bold">
                        {farmer.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{farmer.user.name}</p>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {farmer.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {farmer.city}
                            </span>
                          )}
                          {farmer.yearsExperience && (
                            <span>{farmer.yearsExperience} years experience</span>
                          )}
                        </div>
                        {farmer.specializations.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {farmer.specializations.map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-border pt-5">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Farm</p>
                        <p className="text-sm font-medium">{project.farm.name}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">District</p>
                        <p className="text-sm font-medium">{project.farm.district}, {project.farm.division}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 7. Project Documents ── */}
              {project.documents.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Project Documents</h2>
                  <div className="space-y-2">
                    {project.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.mimeType} · {fileSizeLabel(doc.sizeBytes)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-primary">Download ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 8. Project Updates ── */}
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
                          {u.publishedAt && (
                            <span className="text-xs text-muted-foreground">
                              {fmtDate(u.publishedAt)}
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 font-semibold">{u.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {u.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 9. Risk Information ── */}
              <div>
                <h2 className="mb-4 text-xl font-bold">Risk Information</h2>
                <div className="rounded-xl border border-warning/30 bg-warning-muted p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Investment Risk Disclosure</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Agricultural investments carry inherent risks including adverse weather events,
                        pest and disease outbreaks, market price fluctuations, and operational challenges.
                        Past performance does not guarantee future results. You may receive less than
                        your invested amount.
                      </p>
                    </div>
                  </div>
                  {project.riskInfo && (
                    <div className="border-t border-warning/20 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Project-Specific Risks
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {project.riskInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 10. FAQ ── */}
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
            {/* ── end left column ── */}

            {/* ── Right: sticky sidebar ── */}
            <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">

              {/* ── 11. Investment CTA ── */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-brand-700 to-brand-600 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-100/70">
                    {STATUS_LABELS[project.status] ?? project.status}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatBdt(project.fundedAmountBdt.toString())}
                    <span className="ml-1 text-sm font-normal text-brand-100/80">raised</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-800/50">
                    <div
                      className="h-full rounded-full bg-harvest-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-brand-100/70">
                    {pct}% of {formatBdt(project.fundingGoalBdt.toString())} goal
                  </p>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Key stats */}
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

                  {/* Deadline */}
                  {isOpen && (
                    <div className="flex items-center gap-2 rounded-lg bg-harvest-50 border border-harvest-400/30 px-3 py-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-harvest-600" />
                      <p className="text-xs font-medium text-harvest-600">
                        {days > 0 ? `${days} days left to invest` : "Closing very soon"}
                      </p>
                    </div>
                  )}

                  {/* CTA button */}
                  {isOpen ? (
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
                    <Button className="w-full" variant="outline" disabled>
                      {STATUS_LABELS[project.status] ?? project.status}
                    </Button>
                  ) : (
                    <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
                      <p className="text-sm font-medium">{STATUS_LABELS[project.status] ?? project.status}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This project is not currently accepting investments
                      </p>
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground">
                    By investing you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  </p>
                </CardContent>
              </Card>

              {/* Key dates card */}
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
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {label}
                        </span>
                        <span className="font-medium text-right">{value ?? "TBD"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Farm summary card */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 text-sm font-semibold">Farm Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Farm</span>
                      <span className="font-medium text-right">{project.farm.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-right">{project.farm.district}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Area</span>
                      <span className="font-medium">{Number(project.farm.totalAreaAcres.toString()).toFixed(1)} acres</span>
                    </div>
                    {farmer?.yearsExperience && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Experience</span>
                        <span className="font-medium">{farmer.yearsExperience} years</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Share / help */}
              <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Have questions about this project?</p>
                <ButtonLink href="/contact" variant="outline" className="w-full justify-center text-xs">
                  Contact Support
                </ButtonLink>
              </div>

            </div>
            {/* ── end sidebar ── */}

          </div>
        </div>
      </section>
    </>
  );
}
