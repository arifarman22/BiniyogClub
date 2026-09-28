/**
 * idempotency.ts
 *
 * Helpers for generating and validating idempotency keys.
 * Keys are used to prevent duplicate financial transactions on retry.
 */

import { randomBytes } from "crypto";

/**
 * Generate a cryptographically random idempotency key.
 * Format: <prefix>_<timestamp_base36>_<random_hex>
 * Example: dep_m0abc123_a1b2c3d4e5f6
 */
export function generateIdempotencyKey(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(8).toString("hex");
  return `${prefix}_${ts}_${rand}`;
}

/** Validate that a key matches the expected format and length. */
export function isValidIdempotencyKey(key: string): boolean {
  return typeof key === "string" && key.length >= 16 && key.length <= 128;
}

// ─── Well-known prefixes ──────────────────────────────────────────────────────

export const IDEMPOTENCY_PREFIXES = {
  DEPOSIT:      "dep",
  WITHDRAWAL:   "wdl",
  INVESTMENT:   "inv",
  DISTRIBUTION: "dst",
  REFUND:       "ref",
  FEE:          "fee",
  ADJUSTMENT:   "adj",
  PAYMENT:      "pay",
  WEBHOOK:      "whk",
} as const;
