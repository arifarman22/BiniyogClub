/**
 * providers/bkash.provider.ts
 *
 * bKash Payment Gateway stub.
 *
 * Production credentials must be obtained from bKash directly.
 * Required env vars (set in .env — never commit values):
 *   BKASH_APP_KEY
 *   BKASH_APP_SECRET
 *   BKASH_USERNAME
 *   BKASH_PASSWORD
 *   BKASH_BASE_URL   (sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta)
 *
 * Docs: https://developer.bka.sh/
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

export const bkashProvider: PaymentProvider = {
  key: "bkash",
  displayName: "bKash",

  async createPayment(_req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    throw new Error(
      "bKash provider is not yet configured. " +
        "Set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL in .env",
    );
  },

  async getPaymentStatus(_providerPaymentId: string): Promise<PaymentStatusResponse> {
    throw new Error("bKash provider is not yet configured.");
  },

  async verifyWebhook(_req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    throw new Error("bKash provider is not yet configured.");
  },

  async refund(_req: RefundRequest): Promise<RefundResponse> {
    throw new Error("bKash provider is not yet configured.");
  },
};
