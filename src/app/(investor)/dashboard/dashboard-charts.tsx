"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface MonthlyPoint {
  month: string;
  invested: number;
  returned: number;
}

interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  monthlyHistory: MonthlyPoint[];
  categoryData: CategorySlice[];
}

function fmtK(n: number) {
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)   return `৳${(n / 1_000).toFixed(0)}K`;
  return `৳${n}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "invested" ? "Invested" : "Returns"}: {fmtK(p.value)}
        </p>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="surface-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{fmtK(d.value)}</p>
    </div>
  );
}

export function DashboardCharts({ monthlyHistory, categoryData }: Props) {
  const hasMonthly = monthlyHistory.some((m) => m.invested > 0 || m.returned > 0);
  const hasCategory = categoryData.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">

      {/* Area chart — 2/3 width */}
      <div className="surface-card p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Investment Activity</p>
            <p className="text-[11px] text-muted-foreground">Last 12 months</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> Invested
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-harvest-500" /> Returns
            </span>
          </div>
        </div>

        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-brand-500)"   stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-brand-500)"   stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReturned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-harvest-500)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-harvest-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtK}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="var(--color-brand-500)"
                strokeWidth={2}
                fill="url(#gInvested)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="returned"
                stroke="var(--color-harvest-500)"
                strokeWidth={2}
                fill="url(#gReturned)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </div>
        )}
      </div>

      {/* Donut chart — 1/3 width */}
      <div className="surface-card p-5">
        <div className="mb-4">
          <p className="font-semibold text-sm">Allocation</p>
          <p className="text-[11px] text-muted-foreground">By category</p>
        </div>

        {hasCategory ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="45%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
              <Legend
                iconType="circle"
                iconSize={7}
                formatter={(value) => (
                  <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No data yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
