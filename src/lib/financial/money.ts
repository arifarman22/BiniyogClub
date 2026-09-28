/**
 * money.ts
 *
 * All financial arithmetic in this system uses integer-based BDT paisa
 * (1 BDT = 100 paisa) to avoid IEEE-754 floating-point errors.
 *
 * External representation: Decimal(14,2) in PostgreSQL, number with 2dp in JS.
 * Internal representation: bigint paisa for all arithmetic.
 */

export const CURRENCY = "BDT" as const;
export const PLATFORM_FEE_PCT = 2.5; // 2.5% platform fee on returns

// ─── Conversion ───────────────────────────────────────────────────────────────

/** Convert a BDT decimal (e.g. 1000.50) to integer paisa (100050n). */
export function toBigIntPaisa(bdt: number | string): bigint {
  const str = typeof bdt === "number" ? bdt.toFixed(2) : Number(bdt).toFixed(2);
  const [whole, frac = "00"] = str.split(".");
  return BigInt(whole) * 100n + BigInt(frac.padEnd(2, "0").slice(0, 2));
}

/** Convert integer paisa back to a BDT number with exactly 2 decimal places. */
export function fromBigIntPaisa(paisa: bigint): number {
  const abs = paisa < 0n ? -paisa : paisa;
  const sign = paisa < 0n ? -1 : 1;
  const whole = abs / 100n;
  const frac = abs % 100n;
  return sign * Number(`${whole}.${String(frac).padStart(2, "0")}`);
}

// ─── Arithmetic ───────────────────────────────────────────────────────────────

/** Add two BDT amounts. Returns BDT number. */
export function addBdt(a: number, b: number): number {
  return fromBigIntPaisa(toBigIntPaisa(a) + toBigIntPaisa(b));
}

/** Subtract b from a. Returns BDT number. */
export function subtractBdt(a: number, b: number): number {
  return fromBigIntPaisa(toBigIntPaisa(a) - toBigIntPaisa(b));
}

/** Multiply a BDT amount by a percentage (e.g. 15.0 for 15%). Returns BDT number. */
export function applyPct(amountBdt: number, pct: number): number {
  // Use integer arithmetic: multiply paisa by pct*100, then divide by 10000
  const paisa = toBigIntPaisa(amountBdt);
  const pctInt = Math.round(pct * 100); // e.g. 15.0% → 1500
  const result = (paisa * BigInt(pctInt)) / 10000n;
  return fromBigIntPaisa(result);
}

/** Calculate platform fee on a return amount. */
export function calculatePlatformFee(returnAmountBdt: number): number {
  return applyPct(returnAmountBdt, PLATFORM_FEE_PCT);
}

/** Calculate net amount after platform fee. */
export function calculateNetReturn(grossReturnBdt: number): {
  gross: number;
  fee: number;
  net: number;
} {
  const fee = calculatePlatformFee(grossReturnBdt);
  const net = subtractBdt(grossReturnBdt, fee);
  return { gross: grossReturnBdt, fee, net };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Returns true if the amount has at most 2 decimal places. */
export function isValidBdtAmount(amount: number): boolean {
  if (!isFinite(amount) || isNaN(amount) || amount < 0) return false;
  return Math.round(amount * 100) === amount * 100;
}

/** Throws if amount is not a valid positive BDT value. */
export function assertPositiveBdt(amount: number, label = "Amount"): void {
  if (!isFinite(amount) || isNaN(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive number, got: ${amount}`);
  }
  if (!isValidBdtAmount(amount)) {
    throw new Error(`${label} must have at most 2 decimal places, got: ${amount}`);
  }
}

/** Round a number to 2 decimal places (BDT precision). */
export function roundBdt(amount: number): number {
  return Math.round(amount * 100) / 100;
}
