type Pct = number | string | { toString(): string } | null | undefined;

export interface ReturnFields {
  expectedReturnPct: Pct;
  returnPctMin?: Pct;
  returnPctMax?: Pct;
}

/**
 * A project uses a return range whenever both bounds are set — the admin form
 * stores ranges this way regardless of returnType, and saves the lower bound
 * into expectedReturnPct. So never decide range-vs-fixed from returnType.
 */
export function getReturnRange(p: ReturnFields): { min: number; max: number } | null {
  if (p.returnPctMin == null || p.returnPctMax == null) return null;
  const min = Number(p.returnPctMin.toString());
  const max = Number(p.returnPctMax.toString());
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) return null;
  return { min, max };
}

/** "16.0–20.0%" for a range, "16.0%" for a fixed rate. */
export function formatReturnPct(p: ReturnFields, digits = 1): string {
  const range = getReturnRange(p);
  if (range) return `${range.min.toFixed(digits)}–${range.max.toFixed(digits)}%`;
  return `${Number((p.expectedReturnPct ?? 0).toString()).toFixed(digits)}%`;
}
