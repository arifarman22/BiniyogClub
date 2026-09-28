/**
 * providers/bank.provider.ts
 *
 * Bank transfer provider stub.
 *
 * Bank transfers are typically manual or semi-automated (BEFTN/RTGS in Bangladesh).
 * This stub represents the interface for an automated bank transfer API.
 *
 * Required env vars:
 *   BANK_API_KEY
 *   BANK_API_SECRET
 *   BANK_BASE_URL
 *   BANK_WEBHOOK_SECRET
 */

import type {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  WebhookVerificationRequest,
  WebhookVerificationResult,
  RefundRequest,
  RefundResponse,
} from "../types";

export const bankProvider: PaymentProvider = {
  key: "bank",
  displayName: "Bank Transfer",

  async createPayment(_req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    throw new Error(
      "Bank transfer provider is not yet configured. " +
        "Set BANK_API_KEY, BANK_API_SECRET, BANK_BASE_URL in .env",
    );
  },

  async getPaymentStatus(_providerPaymentId: string): Promise<PaymentStatusResponse> {
    throw new Error("Bank transfer provider is not yet configured.");
  },

  async verifyWebhook(_req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    throw new Error("Bank transfer provider is not yet configured.");
  },

  async refund(_req: RefundRequest): Promise<RefundResponse> {
    throw new Error("Bank transfer provider is not yet configured.");
  },
};
