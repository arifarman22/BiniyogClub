import { z } from "zod";

// ─── Enum literals ────────────────────────────────────────────────────────────

const PaymentMethodEnum = z.enum([
  "BANK_TRANSFER",
  "MOBILE_BANKING",
  "CARD",
  "WALLET",
]);

// ─── Create investment ────────────────────────────────────────────────────────

export const createInvestmentSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  amountBdt: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .refine((v) => Math.round(v * 100) === v * 100, { message: "Amount must have at most 2 decimal places" }),
  paymentMethod: PaymentMethodEnum,
  // Client-supplied idempotency key — prevents duplicate submissions on retry
  idempotencyKey: z
    .string()
    .min(16, "Idempotency key too short")
    .max(128, "Idempotency key too long"),
});

// ─── Confirm payment ──────────────────────────────────────────────────────────

export const confirmPaymentSchema = z.object({
  investmentId: z.string().uuid("Invalid investment ID"),
  externalReference: z.string().min(1).max(255),
  gatewayResponse: z.record(z.string(), z.unknown()).optional(),
});

// ─── Cancel investment ────────────────────────────────────────────────────────

export const cancelInvestmentSchema = z.object({
  investmentId: z.string().uuid("Invalid investment ID"),
  reason: z.string().min(1, "Reason is required").max(500),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type CancelInvestmentInput = z.infer<typeof cancelInvestmentSchema>;
