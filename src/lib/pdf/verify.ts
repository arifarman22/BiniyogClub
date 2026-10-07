/**
 * verify.ts
 *
 * HMAC-SHA256 signing and verification for investment receipts.
 * The hash is computed over immutable investment fields so any
 * tampering with the PDF data will fail verification.
 */

import { createHmac, timingSafeEqual } from "crypto";

const secret = () => {
  const s = process.env.RECEIPT_HMAC_SECRET;
  if (!s) {
    console.warn("[verify] RECEIPT_HMAC_SECRET is not set — receipt hash will be unsigned");
    return "unsigned";
  }
  return s;
};

export interface ReceiptPayload {
  receiptNumber: string;
  investmentId: string;
  amountBdt: number;
  activatedAt: string;
  investorEmail: string;
}

/** Produces a deterministic HMAC-SHA256 hex string over the receipt fields. */
export function signReceipt(payload: ReceiptPayload): string {
  const message = [
    payload.receiptNumber,
    payload.investmentId,
    payload.amountBdt.toFixed(2),
    payload.activatedAt,
    payload.investorEmail,
  ].join("|");

  return createHmac("sha256", secret()).update(message).digest("hex");
}

/** Constant-time comparison — safe against timing attacks. */
export function verifyReceipt(payload: ReceiptPayload, hash: string): boolean {
  try {
    const expected = signReceipt(payload);
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
