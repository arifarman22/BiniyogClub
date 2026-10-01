"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  month: string;
  invested: number;
  distributed: number;
  withdrawn: number;
  newInvestors: number;
}

interface GroupRow { status?: string; returnType?: string; category?: string; _count: { _all: number }; _sum?: { amountBdt?: unknown; fundedAmountBdt?: unknown } }

interface TopProject {
  title: string; category: string; status: string;
  fundingGoalBdt: unknown; fundedAmountBdt: unknown;
  _count: { investments: number };
}

interface Props {
  monthly: MonthlyPoint[];
  investmentsByStatus: GroupRow[];
  investmentsByReturnType: GroupRow[];
  projectsByStatus: GroupRow[];
  projectsByCategory: GroupRow[];
  topProjects: TopProject[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
  return `৳${n}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name !== "Investors" ? fmtK(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{typeof d.value === "number" && d.value > 1000 ? fmtK(d.value) : d.value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#008C64", FUNDRAISING: "#3B82F6", FUNDED: "#8B5CF6",
  COMPLETED: "#10B981", MATURED: "#10B981", CANCELLED: "#EF4444",
  PENDING: "#F59E0B", DRAFT: "#9CA3AF", REFUNDED: "#6B7280",
  PAYMENT_PENDING: "#F59E0B",
};

const CAT_COLORS: Record<string, string> = {
  REAL_ESTATE: "#008C64", TRADE_FINANCE: "#3B82F6", SME: "#F59E0B",
  TECHNOLOGY: "#8B5CF6", INFRASTRUCTURE: "#EC4899", OTHER: "#6B7280",
};

const RETURN_COLORS: Record<string, string> = {
  FIXED: "#008C64", PROFIT_SHARE: "#3B82F6", HYBRID: "#8B5CF6",
};

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <p className="font-semibold text-sm">{title}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminAnalyticsCharts({
  monthly, investmentsByStatus, investmentsByReturnType,
  projectsByStatus, projectsByCategory, topProjects,
}: Props) {

  const hasMonthly = monthly.some((m) => m.invested > 0 || m.distributed > 0);

  // Pie data
  const statusPie = investmentsByStatus.map((r) => ({
    name: (r.status ?? "").replace(/_/g, " "),
    value: r._count._all,
    color: STATUS_COLORS[r.status ?? ""] ?? "#9CA3AF",
  }));

  const catPie = projectsByCategory.map((r) => ({
    name: (r.category ?? "").replace(/_/g, " "),
    value: Number(r._sum?.fundedAmountBdt ?? 0),
    color: CAT_COLORS[r.category ?? ""] ?? "#9CA3AF",
  })).filter((d) => d.value > 0);

  const returnTypePie = investmentsByReturnType.map((r) => ({
    name: (r.returnType ?? "").replace(/_/g, " "),
    value: r._count._all,
    color: RETURN_COLORS[r.returnType ?? ""] ?? "#9CA3AF",
  }));

  const projectStatusBar = projectsByStatus.map((r) => ({
    name: (r.status ?? "").replace(/_/g, " "),
    count: r._count._all,
    color: STATUS_COLORS[r.status ?? ""] ?? "#9CA3AF",
  }));

  // Top projects bar
  const topProjectsBar = topProjects.map((p) => ({
    name: p.title.length > 20 ? p.title.slice(0, 18) + "…" : p.title,
    funded: Number(p.fundedAmountBdt),
    goal: Number(p.fundingGoalBdt),
    investors: p._count.investments,
  }));

  return (
    <div className="space-y-5">

      {/* Row 1: Investment + Investor growth (full width area chart) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Investment Volume" sub="Monthly invested vs distributed (12 months)" >
          <div className="lg:col-span-2" />
          {hasMonthly ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="aInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008C64" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#008C64" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aDistributed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#008C64" strokeWidth={2} fill="url(#aInvested)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="distributed" name="Distributed" stroke="#3B82F6" strokeWidth={2} fill="url(#aDistributed)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>

        <ChartCard title="Withdrawals" sub="Monthly completed withdrawals">
          {hasMonthly ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="withdrawn" name="Withdrawn" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Investor growth + Project status + Return type */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="Investor Growth" sub="New investors per month">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="newInvestors" name="Investors" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Projects by Status" sub="Current distribution">
          {projectStatusBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projectStatusBar} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Projects" radius={[0, 3, 3, 0]}>
                  {projectStatusBar.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>

        <ChartCard title="Investment by Return Type" sub="Count by structure">
          {returnTypePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={returnTypePie} cx="50%" cy="45%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {returnTypePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Investment status pie + Category funding + Top projects */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="Investments by Status" sub="Count breakdown">
          {statusPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="45%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>

        <ChartCard title="Funding by Category" sub="Total funded amount">
          {catPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catPie} cx="50%" cy="45%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {catPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>

        <ChartCard title="Top Projects" sub="By funded amount">
          {topProjectsBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProjectsBar} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="funded" name="Funded" fill="#008C64" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
          )}
        </ChartCard>
      </div>

    </div>
  );
}
