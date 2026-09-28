import { z } from "zod";

const PROVIDER_KEYS = ["mock", "bkash", "nagad", "card", "bank"] as const;

export const initiatePaymentSchema = z.object({
  investmentId: z.string().uuid("Invalid investment ID"),
  provider: z.enum(PROVIDER_KEYS, { error: "Invalid payment provider" }),
  successUrl: z.string().url("Invalid success URL"),
  cancelUrl: z.string().url("Invalid cancel URL"),
  mobileNumber: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi mobile number")
    .optional(),
});

export const verifyPaymentSchema = z.object({
  gatewayPaymentId: z.string().uuid("Invalid gateway payment ID"),
});

export const refundPaymentSchema = z.object({
  gatewayPaymentId: z.string().uuid("Invalid gateway payment ID"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
