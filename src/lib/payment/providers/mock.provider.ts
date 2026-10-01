/**
 * providers/mock.provider.ts
 *
 * Mock payment provider for development and testing.
 * Simulates the full payment lifecycle without any real network calls.
 *
 * Behaviour is controlled by the amount:
 *   - amountBdt ending in .00  → SUCCESS  (default)
 *   - amountBdt ending in .01  → FAILED
 *   - amountBdt ending in .02  → EXPIRED
 *   - amountBdt ending in .03  → CANCELLED
 *
 * Webhook secret: "mock-webhook-secret" (set MOCK_WEBHOOK_SECRET in .env to override)
 */

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  WebhookVerificationRequest,
  WebhookVerificationResult,
  RefundRequest,
  RefundResponse,
  GatewayPaymentStatus,
} from "../types";

// In-memory store for mock payment sessions (dev only — resets on server restart)
const mockStore = new Map<string, { status: GatewayPaymentStatus; amountBdt: number; currency: string }>();

function resolveStatus(amountBdt: number): GatewayPaymentStatus {
  const cents = Math.round((amountBdt % 1) * 100);
  if (cents === 1) return "FAILED";
  if (cents === 2) return "EXPIRED";
  if (cents === 3) return "CANCELLED";
  return "SUCCESS";
}

const WEBHOOK_SECRET =
  process.env.MOCK_WEBHOOK_SECRET ?? "mock-webhook-secret-do-not-use-in-production";

export const mockProvider: PaymentProvider = {
  key: "mock",
  displayName: "Mock Payment (Dev)",

  async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const providerPaymentId = `mock_pay_${randomUUID()}`;
    const providerOrderId = `mock_ord_${randomUUID()}`;

    mockStore.set(providerPaymentId, {
      status: "PENDING",
      amountBdt: req.amountBdt,
      currency: req.currency,
    });

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Simulate checkout URL — in dev the frontend hits /api/mock-payment/complete
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mock-payment/complete?paymentId=${providerPaymentId}&orderId=${providerOrderId}&idempotencyKey=${req.idempotencyKey}`;

    return {
      providerPaymentId,
      providerOrderId,
      checkoutUrl,
      expiresAt,
      rawResponse: {
        paymentId: providerPaymentId,
        orderId: providerOrderId,
        status: "PENDING",
        amount: req.amountBdt,
        currency: req.currency,
        expiresAt: expiresAt.toISOString(),
      },
    };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResponse> {
    const record = mockStore.get(providerPaymentId);

    if (!record) {
      return {
        providerPaymentId,
        status: "FAILED",
        amountBdt: 0,
        currency: "BDT",
        failureReason: "Payment not found in mock store",
        rawResponse: { error: "not_found" },
      };
    }

    // Auto-resolve PENDING to final status on first poll
    if (record.status === "PENDING") {
      record.status = resolveStatus(record.amountBdt);
      mockStore.set(providerPaymentId, record);
    }

    return {
      providerPaymentId,
      status: record.status,
      amountBdt: record.amountBdt,
      currency: record.currency,
      rawResponse: { paymentId: providerPaymentId, status: record.status },
    };
  },

  async verifyWebhook(req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    // Verify HMAC-SHA256 signature using constant-time comparison
    const signature = req.headers["x-mock-signature"];
    const expected = createHmac("sha256", WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(typeof signature === "string" ? signature : "", "hex");
    const expBuffer = Buffer.from(expected, "hex");
    const signatureValid =
      sigBuffer.length === expBuffer.length &&
      timingSafeEqual(sigBuffer, expBuffer);

    if (!signatureValid) {
      return {
        valid: false,
        eventId: "",
        eventType: "",
        providerPaymentId: "",
        status: "FAILED",
        amountBdt: 0,
        currency: "BDT",
        rawEvent: {},
      };
    }

    const body = req.parsedBody as {
      eventId: string;
      eventType: string;
      paymentId: string;
      status: GatewayPaymentStatus;
      amount: number;
      currency: string;
    };

    // Update in-memory store
    const existing = mockStore.get(body.paymentId);
    if (existing) {
      existing.status = body.status;
      mockStore.set(body.paymentId, existing);
    }

    return {
      valid: true,
      eventId: body.eventId,
      eventType: body.eventType,
      providerPaymentId: body.paymentId,
      status: body.status,
      amountBdt: body.amount,
      currency: body.currency,
      rawEvent: req.parsedBody,
    };
  },

  async refund(req: RefundRequest): Promise<RefundResponse> {
    const record = mockStore.get(req.providerPaymentId);
    if (record) {
      record.status = "REFUNDED";
      mockStore.set(req.providerPaymentId, record);
    }

    return {
      refundId: `mock_ref_${randomUUID()}`,
      status: "SUCCESS",
      rawResponse: {
        refundId: `mock_ref_${randomUUID()}`,
        originalPaymentId: req.providerPaymentId,
        amount: req.amountBdt,
        reason: req.reason,
      },
    };
  },
};
