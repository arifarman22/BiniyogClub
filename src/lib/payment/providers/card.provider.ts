/**
 * providers/card.provider.ts
 *
 * Card payment gateway stub (e.g. SSLCommerz, ShurjoPay, or Stripe).
 *
 * Required env vars:
 *   CARD_GATEWAY_STORE_ID
 *   CARD_GATEWAY_STORE_PASSWORD
 *   CARD_GATEWAY_BASE_URL
 *   CARD_GATEWAY_WEBHOOK_SECRET
 *
 * Replace with your chosen gateway's SDK/API calls.
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

export const cardProvider: PaymentProvider = {
  key: "card",
  displayName: "Card Payment",

  async createPayment(_req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    throw new Error(
      "Card gateway is not yet configured. " +
        "Set CARD_GATEWAY_STORE_ID, CARD_GATEWAY_STORE_PASSWORD, CARD_GATEWAY_BASE_URL in .env",
    );
  },

  async getPaymentStatus(_providerPaymentId: string): Promise<PaymentStatusResponse> {
    throw new Error("Card gateway is not yet configured.");
  },

  async verifyWebhook(_req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    throw new Error("Card gateway is not yet configured.");
  },

  async refund(_req: RefundRequest): Promise<RefundResponse> {
    throw new Error("Card gateway is not yet configured.");
  },
};
