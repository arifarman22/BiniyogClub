/**
 * payment/types.ts
 *
 * Provider-agnostic payment abstraction layer.
 *
 * Security invariant:
 *   Frontend success callbacks MUST NOT activate investments.
 *   Only a server-side verified payment (verifyWebhook / getPaymentStatus
 *   returning SUCCESS) may trigger investment activation.
 */

export type GatewayPaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export type PaymentProviderKey = "mock" | "bkash" | "nagad" | "card" | "bank";

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreatePaymentRequest {
  idempotencyKey: string;
  amountBdt: number;
  currency: string;
  investmentId: string;
  successUrl: string;
  cancelUrl: string;
  description: string;
  mobileNumber?: string;
  cardHolderName?: string;
}

export interface CreatePaymentResponse {
  providerPaymentId: string;
  providerOrderId?: string;
  /** Hosted checkout URL. Null for server-to-server flows. */
  checkoutUrl: string | null;
  expiresAt: Date;
  rawResponse: Record<string, unknown>;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export interface PaymentStatusResponse {
  providerPaymentId: string;
  status: GatewayPaymentStatus;
  amountBdt: number;
  currency: string;
  failureReason?: string;
  rawResponse: Record<string, unknown>;
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface WebhookVerificationRequest {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  parsedBody: Record<string, unknown>;
}

export interface WebhookVerificationResult {
  valid: boolean;
  eventId: string;
  eventType: string;
  providerPaymentId: string;
  status: GatewayPaymentStatus;
  amountBdt: number;
  currency: string;
  rawEvent: Record<string, unknown>;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface RefundRequest {
  providerPaymentId: string;
  amountBdt: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResponse {
  refundId: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  rawResponse: Record<string, unknown>;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface PaymentProvider {
  readonly key: PaymentProviderKey;
  readonly displayName: string;

  createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResponse>;
  verifyWebhook(req: WebhookVerificationRequest): Promise<WebhookVerificationResult>;
  refund(req: RefundRequest): Promise<RefundResponse>;
}

// ─── Service-level types ──────────────────────────────────────────────────────

export interface InitiatePaymentInput {
  investmentId: string;
  provider: PaymentProviderKey;
  amountBdt: number;
  successUrl: string;
  cancelUrl: string;
  mobileNumber?: string;
}

export interface PaymentVerificationResult {
  gatewayPaymentId: string;
  investmentId: string;
  status: GatewayPaymentStatus;
  investmentActivated: boolean;
  receiptNumber?: string;
}
