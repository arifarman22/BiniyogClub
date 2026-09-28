/**
 * providers/nagad.provider.ts
 *
 * Nagad Payment Gateway stub.
 *
 * Required env vars:
 *   NAGAD_MERCHANT_ID
 *   NAGAD_MERCHANT_PRIVATE_KEY   (PGP private key, PEM format)
 *   NAGAD_PAYMENT_PUBLIC_KEY     (Nagad's public key, PEM format)
 *   NAGAD_BASE_URL               (sandbox: http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0)
 *
 * Docs: https://nagad.com.bd/developer
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

export const nagadProvider: PaymentProvider = {
  key: "nagad",
  displayName: "Nagad",

  async createPayment(_req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    throw new Error(
      "Nagad provider is not yet configured. " +
        "Set NAGAD_MERCHANT_ID, NAGAD_MERCHANT_PRIVATE_KEY, NAGAD_PAYMENT_PUBLIC_KEY, NAGAD_BASE_URL in .env",
    );
  },

  async getPaymentStatus(_providerPaymentId: string): Promise<PaymentStatusResponse> {
    throw new Error("Nagad provider is not yet configured.");
  },

  async verifyWebhook(_req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    throw new Error("Nagad provider is not yet configured.");
  },

  async refund(_req: RefundRequest): Promise<RefundResponse> {
    throw new Error("Nagad provider is not yet configured.");
  },
};
