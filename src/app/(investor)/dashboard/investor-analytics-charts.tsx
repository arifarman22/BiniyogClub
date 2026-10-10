"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface MonthlyPoint { month: string; invested: number; returned: number }
interface CategorySlice { name: string; value: number; color: string }
interface DistPoint { month: string; amount: number }
interface StatusSlice { name: string; value: number; color: string }

interface Props {
  monthlyHistory: MonthlyPoint[];
  categoryData: CategorySlice[];
  distributionHistory: DistPoint[];
  statusData: StatusSlice[];
}

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
    <div className="surface-card px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmtK(p.value)}</p>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="surface-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{fmtK(d.value)}</p>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6">
      <div className="mb-4">
        <p className="font-semibold text-sm">{title}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function InvestorAnalyticsCharts({ monthlyHistory, categoryData, distributionHistory, statusData }: Props) {
  const hasMonthly = monthlyHistory.some((m) => m.invested > 0 || m.returned > 0);
  const hasDist = distributionHistory.some((d) => d.amount > 0);
  const hasCategory = categoryData.length > 0;
  const hasStatus = statusData.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">

      {/* Investment history area chart */}
      <ChartCard title="Investment Activity" sub="Monthly invested vs returns (12 months)">
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={monthlyHistory} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="iInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008C64" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#008C64" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="iReturned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="invested" name="Invested" stroke="#008C64" strokeWidth={2} fill="url(#iInvested)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="returned" name="Returns" stroke="#F59E0B" strokeWidth={2} fill="url(#iReturned)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">No activity yet.</div>
        )}
      </ChartCard>

      {/* Distribution history bar chart */}
      <ChartCard title="Distribution History" sub="Monthly returns received (12 months)">
        {hasDist ? (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={distributionHistory} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" name="Distributed" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">No distributions yet.</div>
        )}
      </ChartCard>

      {/* Portfolio allocation donut */}
      <ChartCard title="Portfolio Allocation" sub="By project category">
        {hasCategory ? (
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="45%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">No investments yet.</div>
        )}
      </ChartCard>

      {/* Investment status donut */}
      <ChartCard title="Investment Status" sub="Current portfolio breakdown">
        {hasStatus ? (
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="45%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">No investments yet.</div>
        )}
      </ChartCard>

    </div>
  );
}
