import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Clock, Calendar, AlertCircle, TrendingUp, FileText, CheckCircle2,
  ChevronRight, Users, ExternalLink, MessageSquare, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { getProjectBySlug, getAllProjectSlugs } from "@/server/data/public.data";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { ProjectInvestForm } from "@/components/shared/project-invest-form";
import { ProjectBankDetails } from "@/components/shared/project-bank-details";
import { ProjectStatusBadge } from "@/components/shared/project-status-badge";
import { ProjectInvestmentStatus } from "@/components/shared/project-investment-status";
import type { ExistingInvestment } from "@/components/shared/project-investment-status";

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

const STATUS_DOT: Record<string, string> = {
  FUNDRAISING: "bg-amber-400", FUNDED: "bg-emerald-400",
  ACTIVE: "bg-emerald-400", COMPLETED: "bg-sky-400", CANCELLED: "bg-red-400",
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
  { q: "When will I receive my returns?", a: "Returns are paid according to the schedule in the project agreement and credited to your Biniyog Club wallet. You will be notified each time a payout is made." },
  { q: "Can I withdraw my investment early?", a: "Early exit depends on the project agreement. Contact our investor desk before committing if you may need your funds before maturity." },
  { q: "What happens if the funding goal is not reached?", a: "If a project doesn't reach its funding goal by the deadline, investor funds are handled as set out in the project agreement, which you can review before investing." },
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
  let existingInvestment: ExistingInvestment | null = null;
  let walletBalance = 0;

  if (session) {
    const [kyc, profile, wallet] = await Promise.all([
      db.kyc.findUnique({ where: { userId: session.id }, select: { status: true } }),
      db.investorProfile.findUnique({ where: { userId: session.id }, select: { id: true } }),
      db.wallet.findUnique({ where: { userId: session.id }, select: { cachedBalance: true } }),
    ]);
    kycApproved = kyc?.status === "VERIFIED";
    walletBalance = Number(wallet?.cachedBalance ?? 0);

    if (profile) {
      const invs = await db.investment.findMany({
        where: {
          investorProfileId: profile.id,
          projectId: project.id,
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        select: {
          id: true,
          status: true,
          amountBdt: true,
          expectedReturnBdt: true,
          manualPayments: {
            where: { submittedBy: session.id },
            select: { id: true, status: true, transactionRef: true, rejectionReason: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (invs.length > 0) {
        // Use the most recent non-cancelled investment for status display
        const inv = invs[0];
        existingInvestment = {
          id: inv.id,
          status: inv.status,
          amountBdt: Number(inv.amountBdt),
          expectedReturnBdt: Number(inv.expectedReturnBdt),
          lastSubmission: inv.manualPayments[0] ?? null,
        };
      }
    }
  }

  const pct = fundingPct(project.fundedAmountBdt.toString(), project.fundingGoalBdt.toString());
  const remaining = Math.max(0, Number(project.fundingGoalBdt) - Number(project.fundedAmountBdt));
  const days = daysLeft(project.fundingDeadline);
  const isOpen = project.status === "FUNDRAISING";
  const isRunning = project.status === "FUNDED" || project.status === "ACTIVE";
  const isClosed = ["COMPLETED", "CANCELLED"].includes(project.status);
  const canInvestNow = isOpen || isRunning;

  const returnLabel =
    project.returnType === "PROFIT_SHARE" && project.returnPctMin && project.returnPctMax
      ? `${Number(project.returnPctMin).toFixed(1)}–${Number(project.returnPctMax).toFixed(1)}%`
      : `${Number(project.expectedReturnPct).toFixed(1)}%`;

  const gallery = [
    ...(project.coverImageUrl ? [project.coverImageUrl] : []),
    ...project.imageUrls.filter((u) => u !== project.coverImageUrl),
  ].slice(0, 5);

  const now = new Date();
  const milestones = [
    { label: "Funding deadline", date: project.fundingDeadline, icon: Calendar },
    { label: "Project start", date: project.startDate, icon: TrendingUp },
    { label: "Maturity", date: project.endDate, icon: CheckCircle2 },
  ].map((m) => ({ ...m, done: !!m.date && new Date(m.date) < now }));

  const financials = [
    { label: "Funding goal", value: formatBdtFull(project.fundingGoalBdt.toString()) },
    { label: "Minimum to activate", value: formatBdtFull(project.fundingMinBdt.toString()) },
    { label: "Amount raised", value: formatBdtFull(project.fundedAmountBdt.toString()) },
    { label: "Still needed", value: formatBdtFull(remaining) },
    { label: "Minimum investment", value: formatBdtFull(project.minInvestmentBdt.toString()) },
    ...(project.maxInvestmentBdt
      ? [{ label: "Maximum investment", value: formatBdtFull(project.maxInvestmentBdt.toString()) }]
      : []),
    { label: "Expected return", value: `${returnLabel} · ${RETURN_TYPE_LABELS[project.returnType] ?? project.returnType}` },
    { label: "Duration", value: `${project.durationDays} days` },
    { label: "Investors so far", value: project._count.investments.toLocaleString() },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#040d09] text-white">
        {project.coverImageUrl && (
          <div className="pointer-events-none absolute inset-0">
            <Image src={project.coverImageUrl} alt="" fill priority className="object-cover object-center opacity-25" sizes="100vw" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#040d09] via-[#040d09]/90 to-[#040d09]/60" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_85%_0%,rgba(16,185,129,0.18),transparent)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 items-center gap-1.5 text-sm text-white/50">
            <Link href="/projects" className="shrink-0 transition-colors hover:text-white">Projects</Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-white/80">{project.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[project.status] ?? "bg-white/50"}`} />
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                <span className="border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80">
                  {CATEGORY_LABELS[project.category] ?? project.category}
                </span>
                {project.group && (
                  <Link
                    href={`/groups/${project.group.slug.toLowerCase()}`}
                    className="border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-emerald-400/50 hover:text-white"
                  >
                    {project.group.name}
                  </Link>
                )}
              </div>

              <h1 className="text-3xl font-light leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl">
                {project.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
                {project.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                    {project.location}
                  </span>
                )}
                {isOpen && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
                    {days > 0 ? `${days} days left to invest` : "Closing soon"}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0 text-emerald-400" />
                  {project._count.investments} investor{project._count.investments !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Funding panel */}
            <div className="border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6 lg:col-span-5">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Raised</p>
                  <p className="mt-1 truncate text-3xl font-semibold tabular-nums sm:text-4xl">
                    {formatBdt(project.fundedAmountBdt.toString())}
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm text-white/60">
                  <span className="block text-2xl font-semibold tabular-nums text-emerald-300">{pct}%</span>
                  of {formatBdt(project.fundingGoalBdt.toString())}
                </p>
              </div>
              <div
                className="mt-4 h-2 w-full overflow-hidden bg-white/10"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Funding progress"
              >
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${pct}%` }} />
              </div>
              <dl className="mt-5 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
                <div className="px-1">
                  <dt className="text-[11px] text-white/50">Return</dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold text-emerald-300 sm:text-base">{returnLabel}</dd>
                </div>
                <div className="px-1">
                  <dt className="text-[11px] text-white/50">Minimum</dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold sm:text-base">{formatBdt(project.minInvestmentBdt.toString())}</dd>
                </div>
                <div className="px-1">
                  <dt className="text-[11px] text-white/50">Duration</dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold sm:text-base">{project.durationDays} days</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className={canInvestNow ? "pb-28 pt-10 sm:pt-14 lg:pb-20" : "py-10 sm:py-14 lg:pb-20"}>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">

          {/* Main column */}
          <div className="min-w-0 space-y-12 lg:col-span-8">

            {gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <div className="relative col-span-4 aspect-[16/9] overflow-hidden bg-muted">
                  <Image src={gallery[0]} alt={project.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" />
                </div>
                {gallery.slice(1).map((url, i) => (
                  <div key={url} className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image src={url} alt={`${project.title} — photo ${i + 2}`} fill className="object-cover" sizes="(max-width: 1024px) 25vw, 16vw" />
                  </div>
                ))}
              </div>
            )}

            <section aria-labelledby="about-heading">
              <SectionTitle id="about-heading" eyebrow="Overview">About this project</SectionTitle>
              <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{project.description}</p>
            </section>

            <section aria-labelledby="financials-heading">
              <SectionTitle id="financials-heading" eyebrow="The numbers">Financial details</SectionTitle>
              <dl className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 xl:grid-cols-3">
                {financials.map(({ label, value }) => (
                  <div key={label} className="min-w-0 border-b border-r border-border bg-card px-5 py-4">
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words text-base font-semibold tabular-nums text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="timeline-heading">
              <SectionTitle id="timeline-heading" eyebrow="Schedule">Timeline</SectionTitle>
              <ol className="relative grid gap-6 sm:grid-cols-3 sm:gap-4">
                <span className="absolute left-[19px] top-2 h-[calc(100%-1rem)] w-px bg-border sm:left-0 sm:right-0 sm:top-[19px] sm:h-px sm:w-full" aria-hidden="true" />
                {milestones.map(({ label, date, icon: Icon, done }) => (
                  <li key={label} className="relative flex items-start gap-4 sm:flex-col sm:gap-3">
                    <span
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center border ${done ? "border-primary bg-primary text-white" : "border-border bg-card text-primary"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{fmtDate(date) ?? "To be announced"}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {project.documents.length > 0 && (
              <section aria-labelledby="docs-heading">
                <SectionTitle id="docs-heading" eyebrow="Due diligence">Project documents</SectionTitle>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {project.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{doc.name}</span>
                          <span className="block text-xs text-muted-foreground">{fileSizeLabel(doc.sizeBytes)}</span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {project.updates.length > 0 && (
              <section aria-labelledby="updates-heading">
                <SectionTitle id="updates-heading" eyebrow="Progress">Project updates</SectionTitle>
                <ol className="relative space-y-6 border-l border-border pl-6">
                  {project.updates.map((u) => (
                    <li key={u.id} className="relative">
                      <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 bg-primary ring-4 ring-background" aria-hidden="true" />
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold ${UPDATE_TYPE_COLORS[u.type] ?? "bg-muted text-muted-foreground"}`}>
                          {UPDATE_TYPE_LABELS[u.type] ?? u.type}
                        </span>
                        {u.publishedAt && <span className="text-xs text-muted-foreground">{fmtDate(u.publishedAt)}</span>}
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{u.title}</h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{u.content}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section aria-labelledby="risk-heading">
              <SectionTitle id="risk-heading" eyebrow="Please read">Risk disclosure</SectionTitle>
              <div className="border border-amber-500/30 bg-amber-500/[0.06] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    All investments carry risk, including market fluctuations and operational challenges. Past performance
                    does not guarantee future results, and you may receive less than you invest.
                  </p>
                </div>
                {project.riskInfo && (
                  <div className="mt-5 border-t border-amber-500/20 pt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Project-specific risks</p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{project.riskInfo}</p>
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="faq-heading">
              <SectionTitle id="faq-heading" eyebrow="FAQ">Common questions</SectionTitle>
              <FaqAccordion items={PROJECT_FAQS} />
              <p className="mt-5 text-sm text-muted-foreground">
                More questions?{" "}
                <Link href="/faq" className="font-semibold text-primary hover:underline">Read the full FAQ</Link>
                {" "}or{" "}
                <Link href="/contact" className="font-semibold text-primary hover:underline">contact support</Link>.
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:col-span-4">
            <div id="invest" className="scroll-mt-32 lg:sticky lg:top-32">
              <div className="border border-border bg-card shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">
                    {canInvestNow ? "Invest in this project" : "Investment status"}
                  </h2>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <div className="space-y-4 p-5">
                  {isOpen && (
                    <p className="flex items-center gap-2 border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      <Clock className="h-4 w-4 shrink-0" />
                      {days > 0 ? `${days} days left to invest` : "Closing very soon"}
                    </p>
                  )}
                  {existingInvestment && (
                    <ProjectInvestmentStatus investment={existingInvestment} bankAccounts={project.bankAccounts} />
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
                      walletBalance={walletBalance}
                    />
                  ) : isClosed ? (
                    <Button className="w-full" variant="outline" disabled>
                      {STATUS_LABELS[project.status] ?? project.status}
                    </Button>
                  ) : (
                    <div className="bg-muted/50 px-4 py-3 text-center">
                      <p className="text-sm font-medium">{STATUS_LABELS[project.status] ?? project.status}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">This project is not currently accepting investments.</p>
                    </div>
                  )}
                  <p className="text-center text-xs text-muted-foreground">
                    By investing you agree to our{" "}
                    <Link href="/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link>
                  </p>
                </div>
              </div>

              <dl className="mt-5 divide-y divide-border border border-border bg-card text-sm">
                {[
                  ...(project.group ? [{ label: "Business group", value: project.group.name }] : []),
                  ...(project.location ? [{ label: "Location", value: project.location }] : []),
                  { label: "Category", value: CATEGORY_LABELS[project.category] ?? project.category },
                  { label: "Return type", value: RETURN_TYPE_LABELS[project.returnType] ?? project.returnType },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 px-5 py-3">
                    <dt className="shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              {project.bankAccounts && project.bankAccounts.length > 0 && (
                <div className="mt-5">
                  <ProjectBankDetails bankAccounts={project.bankAccounts} />
                </div>
              )}

              <div className="mt-5 flex items-center gap-4 border border-border bg-muted/40 p-5">
                <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Questions about this project?</p>
                  <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">
                    Contact our investor desk
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Mobile sticky invest bar */}
      {canInvestNow && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(16,24,40,0.2)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {returnLabel} <span className="font-normal text-muted-foreground">expected return</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                From {formatBdt(project.minInvestmentBdt.toString())} · {pct}% funded
              </p>
            </div>
            <a
              href="#invest"
              className="inline-flex shrink-0 items-center gap-1.5 bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25"
            >
              Invest now <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function SectionTitle({ id, eyebrow, children }: { id: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 id={id} className="text-2xl font-light tracking-tight text-foreground sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}
