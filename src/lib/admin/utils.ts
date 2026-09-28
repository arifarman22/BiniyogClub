export function buildAdminUrl(
  base: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function parseAdminParams(sp: Record<string, string | string[] | undefined>) {
  const str = (k: string, fallback = "") =>
    typeof sp[k] === "string" ? (sp[k] as string) : fallback;
  const num = (k: string, fallback = 1) => {
    const v = parseInt(str(k, String(fallback)), 10);
    return isNaN(v) ? fallback : Math.max(1, v);
  };
  return { str, num };
}

export function fmtBdt(n: number | string | { toString(): string }) {
  const v = Number(n);
  if (v >= 10_000_000) return `৳${(v / 10_000_000).toFixed(2)}Cr`;
  if (v >= 100_000) return `৳${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `৳${(v / 1_000).toFixed(1)}K`;
  return `৳${v.toLocaleString("en-BD")}`;
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-BD", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
