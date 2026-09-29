import { z } from "zod";

const PaymentMethodEnum = z.enum(["BANK_TRANSFER", "MOBILE_BANKING", "CARD", "WALLET"]);

const bdtPositive = z.coerce
  .number()
  .positive("Must be greater than 0")
  .refine((v) => Math.round(v * 100) === v * 100, { message: "Must have at most 2 decimal places" });

// ─── Deposit ──────────────────────────────────────────────────────────────────

export const depositSchema = z.object({
  amountBdt: bdtPositive,
  paymentMethod: PaymentMethodEnum,
  externalReference: z.string().min(1).max(255),
  gatewayResponse: z.record(z.string(), z.unknown()).optional(),
  description: z.string().max(500).optional(),
});

// ─── Withdrawal request ───────────────────────────────────────────────────────

export const withdrawalRequestSchema = z
  .object({
    amountBdt: bdtPositive,
    feeBdt: z.coerce.number().min(0).refine((v) => Math.round(v * 100) === v * 100, { message: "Must have at most 2 decimal places" }).optional().default(0),
    method: PaymentMethodEnum,
    bankName: z.string().max(200).optional(),
    accountNumber: z.string().max(50).optional(),
    accountName: z.string().max(200).optional(),
    mobileNumber: z.string().max(20).optional(),
  })
  .refine(
    (d) => {
      if (d.method === "BANK_TRANSFER") return !!d.bankName && !!d.accountNumber;
      if (d.method === "MOBILE_BANKING") return !!d.mobileNumber;
      return true;
    },
    { message: "Bank name and account number required for bank transfer" },
  );

// ─── Approve withdrawal ───────────────────────────────────────────────────────

export const approveWithdrawalSchema = z.object({
  withdrawalId: z.string().uuid("Invalid withdrawal ID"),
});

// ─── Adjustment ───────────────────────────────────────────────────────────────

export const adjustmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  amountBdt: z.coerce
    .number()
    .refine((v) => v !== 0, { message: "Amount cannot be zero" })
    .refine((v) => Math.round(Math.abs(v) * 100) === Math.abs(v) * 100, { message: "Must have at most 2 decimal places" }),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type ApproveWithdrawalInput = z.infer<typeof approveWithdrawalSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
