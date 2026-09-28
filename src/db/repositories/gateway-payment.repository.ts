

import { db } from "@/lib/db/prisma";
import type { GatewayPaymentStatus, PaymentProviderKey } from "@/lib/payment/types";
import type { Prisma } from "@prisma/client";

// ─── Select shape ─────────────────────────────────────────────────────────────

export const gatewayPaymentSelect = {
  id: true,
  investmentId: true,
  walletId: true,
  provider: true,
  status: true,
  amountBdt: true,
  currency: true,
  idempotencyKey: true,
  providerPaymentId: true,
  providerOrderId: true,
  checkoutUrl: true,
  verifiedAt: true,
  verifiedBy: true,
  expiresAt: true,
  failureReason: true,
  providerMetadata: true,
  callbackPayload: true,
  refundedAt: true,
  refundReference: true,
  createdAt: true,
  updatedAt: true,
};

export type GatewayPaymentRecord = Prisma.GatewayPaymentGetPayload<{
  select: typeof gatewayPaymentSelect;
}>;

// ─── Repository ───────────────────────────────────────────────────────────────

export const gatewayPaymentRepository = {
  async create(data: {
    investmentId: string;
    walletId?: string;
    provider: string;
    amountBdt: number;
    currency: string;
    idempotencyKey: string;
    providerPaymentId: string;
    providerOrderId?: string;
    checkoutUrl?: string;
    expiresAt: Date;
    providerMetadata?: Record<string, unknown>;
  }): Promise<GatewayPaymentRecord> {
    return db.gatewayPayment.create({
      data: {
        investmentId: data.investmentId,
        walletId: data.walletId,
        provider: data.provider,
        status: "INITIATED",
        amountBdt: data.amountBdt,
        currency: data.currency,
        idempotencyKey: data.idempotencyKey,
        providerPaymentId: data.providerPaymentId,
        providerOrderId: data.providerOrderId,
        checkoutUrl: data.checkoutUrl,
        expiresAt: data.expiresAt,
        providerMetadata: data.providerMetadata ?? {},
      },
      select: gatewayPaymentSelect,
    });
  },

  async findById(id: string): Promise<GatewayPaymentRecord | null> {
    return db.gatewayPayment.findUnique({ where: { id }, select: gatewayPaymentSelect });
  },

  async findByIdempotencyKey(key: string): Promise<GatewayPaymentRecord | null> {
    return db.gatewayPayment.findUnique({
      where: { idempotencyKey: key },
      select: gatewayPaymentSelect,
    });
  },

  async findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<GatewayPaymentRecord | null> {
    return db.gatewayPayment.findFirst({
      where: { providerPaymentId },
      select: gatewayPaymentSelect,
    });
  },

  async findByInvestmentId(investmentId: string): Promise<GatewayPaymentRecord[]> {
    return db.gatewayPayment.findMany({
      where: { investmentId },
      select: gatewayPaymentSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  async updateStatus(
    id: string,
    status: GatewayPaymentStatus,
    extra?: {
      verifiedAt?: Date;
      verifiedBy?: string;
      failureReason?: string;
      callbackPayload?: Record<string, unknown>;
      refundedAt?: Date;
      refundReference?: string;
    },
  ): Promise<GatewayPaymentRecord> {
    return db.gatewayPayment.update({
      where: { id },
      data: { status, ...extra },
      select: gatewayPaymentSelect,
    });
  },


  async recordWebhookEvent(data: {
    provider: string;
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      await db.webhookEvent.create({
        data: {
          provider: data.provider,
          eventId: data.eventId,
          eventType: data.eventType,
          payload: data.payload,
        },
      });
      return true; // new event
    } catch (err: unknown) {
      // Unique constraint violation = duplicate webhook
      if (
        err instanceof Error &&
        err.message.includes("Unique constraint failed")
      ) {
        return false;
      }
      throw err;
    }
  },

  // ─── Reconciliation ───────────────────────────────────────────────────────

  /** Find all INITIATED or PENDING payments older than the given age (minutes). */
  async findStalePayments(olderThanMinutes: number): Promise<GatewayPaymentRecord[]> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    return db.gatewayPayment.findMany({
      where: {
        status: { in: ["INITIATED", "PENDING"] },
        createdAt: { lt: cutoff },
      },
      select: gatewayPaymentSelect,
      orderBy: { createdAt: "asc" },
    });
  },

  /** Find all payments for a provider in a date range (for reconciliation reports). */
  async findByProviderAndDateRange(
    provider: PaymentProviderKey,
    from: Date,
    to: Date,
  ): Promise<GatewayPaymentRecord[]> {
    return db.gatewayPayment.findMany({
      where: { provider, createdAt: { gte: from, lte: to } },
      select: gatewayPaymentSelect,
      orderBy: { createdAt: "asc" },
    });
  },
};
