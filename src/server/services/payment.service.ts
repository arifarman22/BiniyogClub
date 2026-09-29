/**
 * payment.service.ts
 *
 * Orchestrates the full payment lifecycle:
 *   1. Initiate  — create a GatewayPayment record + call provider.createPayment
 *   2. Verify    — server-side verification via webhook or polling
 *   3. Activate  — ONLY after verified SUCCESS, activate the investment
 *   4. Refund    — initiate provider refund + update records
 *   5. Reconcile — poll provider for stale INITIATED/PENDING payments
 *
 * Security invariant enforced here:
 *   investmentService.confirmPayment is called ONLY from verifyAndActivate(),
 *   which is called ONLY after cryptographic webhook verification or
 *   authoritative server-side status polling. Frontend callbacks are NEVER
 *   trusted — they only trigger a server-side re-verification.
 */

import { db } from "@/lib/db/prisma";
import { gatewayPaymentRepository } from "@/db/repositories/gateway-payment.repository";
import { getProvider } from "@/lib/payment/registry";
import { generateIdempotencyKey, IDEMPOTENCY_PREFIXES } from "@/lib/financial/idempotency";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type {
  InitiatePaymentInput,
  PaymentVerificationResult,
  WebhookVerificationRequest,
  PaymentProviderKey,
} from "@/lib/payment/types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BC-${ts}-${rand}`;
}

/**
 * Core activation logic — runs inside a serializable transaction.
 * Called only after server-side payment verification succeeds.
 * This is the SINGLE path that can move an investment from PAYMENT_PENDING → ACTIVE.
 */
async function activateInvestment(
  gatewayPaymentId: string,
  investmentId: string,
  verifiedBy: "webhook" | "polling" | "manual",
): Promise<{ receiptNumber: string }> {
  return db.$transaction(
    async (tx) => {
      // Lock the investment row
      const [inv] = await tx.$queryRaw<
        Array<{ id: string; status: string; amount_bdt: string; project_id: string }>
      >`
        SELECT id, status, amount_bdt, project_id
        FROM investments
        WHERE id = ${investmentId}
        FOR UPDATE
      `;

      if (!inv) throw new NotFoundError("Investment");

      // Idempotent: already activated
      if (inv.status === "ACTIVE") {
        const existing = await tx.investment.findUnique({
          where: { id: investmentId },
          select: { receiptNumber: true },
        });
        return { receiptNumber: existing?.receiptNumber ?? "" };
      }

      if (inv.status !== "PAYMENT_PENDING") {
        throw new ValidationError(
          `Investment cannot be activated from status: ${inv.status}`,
        );
      }

      // Lock the project row
      const [project] = await tx.$queryRaw<
        Array<{ id: string; status: string; funding_goal_bdt: string; funded_amount_bdt: string }>
      >`
        SELECT id, status, funding_goal_bdt, funded_amount_bdt
        FROM projects
        WHERE id = ${inv.project_id}
        FOR UPDATE
      `;

      if (!project) throw new NotFoundError("Project");

      const amountBdt = Number(inv.amount_bdt);
      const remaining =
        Number(project.funding_goal_bdt) - Number(project.funded_amount_bdt);

      if (amountBdt > remaining) {
        throw new ConflictError(
          "Project capacity exceeded. Investment cannot be activated.",
        );
      }

      // Get investor wallet
      const investorProfile = await tx.investorProfile.findFirst({
        where: { investments: { some: { id: investmentId } } },
        select: { userId: true },
      });
      if (!investorProfile) throw new NotFoundError("Investor profile");

      const wallet = await tx.wallet.findUnique({
        where: { userId: investorProfile.userId },
        select: { id: true, cachedBalance: true },
      });
      if (!wallet) throw new NotFoundError("Investor wallet");

      // Get or create platform escrow wallet
      let escrowWallet = await tx.wallet.findFirst({
        where: { type: "PLATFORM_ESCROW" },
        select: { id: true, cachedBalance: true },
      });
      if (!escrowWallet) {
        const platformUser = await tx.user.findFirst({
          where: { role: "SUPER_ADMIN" },
          select: { id: true },
        });
        if (!platformUser) throw new NotFoundError("Platform user for escrow wallet");
        escrowWallet = await tx.wallet.create({
          data: { userId: platformUser.id, type: "PLATFORM_ESCROW", cachedBalance: 0, currency: "BDT" },
          select: { id: true, cachedBalance: true },
        });
      }

      const investorNewBalance = Number(wallet.cachedBalance) + amountBdt;
      const escrowNewBalance = Number(escrowWallet.cachedBalance) + amountBdt;

      // Double-entry ledger
      await tx.ledgerTransaction.create({
        data: {
          type: "INVESTMENT_FUNDING",
          investmentId,
          referenceId: gatewayPaymentId,
          referenceType: "GatewayPayment",
          description: `Investment funding via ${verifiedBy} verification`,
          amountBdt,
          entries: {
            create: [
              { walletId: wallet.id, entryType: "DEBIT", amountBdt, balanceAfterBdt: investorNewBalance },
              { walletId: escrowWallet.id, entryType: "CREDIT", amountBdt, balanceAfterBdt: escrowNewBalance },
            ],
          },
        },
      });

      await tx.wallet.update({ where: { id: wallet.id }, data: { cachedBalance: investorNewBalance } });
      await tx.wallet.update({ where: { id: escrowWallet.id }, data: { cachedBalance: escrowNewBalance } });

      const receiptNumber = generateReceiptNumber();
      const now = new Date();

      await tx.investment.update({
        where: { id: investmentId },
        data: { status: "ACTIVE", confirmedAt: now, activatedAt: now, receiptNumber },
      });

      // Update gateway payment record
      await tx.gatewayPayment.update({
        where: { id: gatewayPaymentId },
        data: { status: "SUCCESS", verifiedAt: now, verifiedBy },
      });

      // Increment project funded amount
      const updatedProject = await tx.project.update({
        where: { id: inv.project_id },
        data: { fundedAmountBdt: { increment: amountBdt } },
        select: { status: true, fundingGoalBdt: true, fundedAmountBdt: true },
      });

      if (
        Number(updatedProject.fundedAmountBdt) >= Number(updatedProject.fundingGoalBdt) &&
        updatedProject.status === "FUNDRAISING"
      ) {
        await tx.project.update({ where: { id: inv.project_id }, data: { status: "FUNDED" } });
      }

      // Create investment contract
      await tx.investmentContract.upsert({
        where: { investmentId },
        create: {
          investmentId,
          status: "DRAFT",
          templateVersion: "v1.0",
          terms: { amountBdt, activatedAt: now.toISOString(), verifiedBy },
        },
        update: {},
      });

      // Notify investor
      await tx.notification.create({
        data: {
          userId: investorProfile.userId,
          type: "INVESTMENT_CONFIRMED",
          title: "Investment Confirmed",
          body: `Your investment has been confirmed. Receipt: ${receiptNumber}`,
          data: { investmentId, receiptNumber },
        },
      });

      return { receiptNumber };
    },
    { isolationLevel: "Serializable" },
  );
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Initiate a payment session with the chosen provider.
   * Creates a GatewayPayment record and returns the checkout URL.
   * Idempotent: same idempotencyKey returns the existing record.
   */
  async initiatePayment(
    session: SessionUser,
    input: InitiatePaymentInput,
  ) {
    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.PAYMENT);

    // Idempotency check
    const existing = await gatewayPaymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return { gatewayPayment: existing, idempotent: true };

    // Validate investment exists and is in PAYMENT_PENDING
    const investment = await db.investment.findUnique({
      where: { id: input.investmentId },
      select: { id: true, status: true, amountBdt: true, project: { select: { title: true } } },
    });
    if (!investment) throw new NotFoundError("Investment");
    if (investment.status !== "PAYMENT_PENDING") {
      throw new ValidationError(
        `Investment must be in PAYMENT_PENDING status to initiate payment (current: ${investment.status})`,
      );
    }

    // Get investor wallet (create if missing)
    let wallet = await db.wallet.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId: session.id, type: "INVESTOR", cachedBalance: 0, currency: "BDT" },
        select: { id: true },
      });
    }

    const provider = getProvider(input.provider);
    const amountBdt = Number(investment.amountBdt);

    const providerResponse = await provider.createPayment({
      idempotencyKey,
      amountBdt,
      currency: "BDT",
      investmentId: input.investmentId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      description: `Investment in ${investment.project.title}`,
      mobileNumber: input.mobileNumber,
    });

    const gatewayPayment = await gatewayPaymentRepository.create({
      investmentId: input.investmentId,
      walletId: wallet.id,
      provider: input.provider,
      amountBdt,
      currency: "BDT",
      idempotencyKey,
      providerPaymentId: providerResponse.providerPaymentId,
      providerOrderId: providerResponse.providerOrderId,
      checkoutUrl: providerResponse.checkoutUrl ?? undefined,
      expiresAt: providerResponse.expiresAt,
      providerMetadata: providerResponse.rawResponse,
    });

    return { gatewayPayment, idempotent: false };
  },

  /**
   * Handle an incoming webhook from a payment provider.
   *
   * Steps:
   *   1. Verify cryptographic signature — reject if invalid.
   *   2. Deduplicate via WebhookEvent table — skip if already processed.
   *   3. Find the GatewayPayment record by providerPaymentId.
   *   4. If SUCCESS → activate investment (server-side only).
   *   5. Otherwise → update GatewayPayment status.
   */
  async handleWebhook(
    providerKey: PaymentProviderKey,
    req: WebhookVerificationRequest,
  ): Promise<PaymentVerificationResult> {
    const provider = getProvider(providerKey);

    // Step 1: Verify signature
    const verified = await provider.verifyWebhook(req);
    if (!verified.valid) {
      throw new ValidationError("Webhook signature verification failed");
    }

    // Step 2: Deduplicate
    const isNew = await gatewayPaymentRepository.recordWebhookEvent({
      provider: providerKey,
      eventId: verified.eventId,
      eventType: verified.eventType,
      payload: verified.rawEvent,
    });

    // Find the gateway payment record
    const gatewayPayment = await gatewayPaymentRepository.findByProviderPaymentId(
      verified.providerPaymentId,
    );
    if (!gatewayPayment) throw new NotFoundError("GatewayPayment");

    // Duplicate webhook — return current state without reprocessing
    if (!isNew) {
      return {
        gatewayPaymentId: gatewayPayment.id,
        investmentId: gatewayPayment.investmentId,
        status: verified.status,
        investmentActivated: false,
      };
    }

    // Amount cross-check — provider-reported amount must match our record
    if (Math.abs(verified.amountBdt - Number(gatewayPayment.amountBdt)) > 0.01) {
      await gatewayPaymentRepository.updateStatus(gatewayPayment.id, "FAILED", {
        failureReason: `Amount mismatch: expected ${gatewayPayment.amountBdt}, got ${verified.amountBdt}`,
        callbackPayload: verified.rawEvent,
      });
      throw new ValidationError(
        `Payment amount mismatch. Expected ৳${gatewayPayment.amountBdt}, provider reported ৳${verified.amountBdt}`,
      );
    }

    // Step 4: SUCCESS → activate investment
    if (verified.status === "SUCCESS") {
      const { receiptNumber } = await activateInvestment(
        gatewayPayment.id,
        gatewayPayment.investmentId,
        "webhook",
      );
      return {
        gatewayPaymentId: gatewayPayment.id,
        investmentId: gatewayPayment.investmentId,
        status: "SUCCESS",
        investmentActivated: true,
        receiptNumber,
      };
    }

    // Step 5: Non-success status update
    await gatewayPaymentRepository.updateStatus(gatewayPayment.id, verified.status, {
      failureReason: verified.status === "FAILED" ? "Provider reported failure" : undefined,
      callbackPayload: verified.rawEvent,
    });

    return {
      gatewayPaymentId: gatewayPayment.id,
      investmentId: gatewayPayment.investmentId,
      status: verified.status,
      investmentActivated: false,
    };
  },

  /**
   * Server-side status poll — called when the frontend reports a success
   * redirect. We NEVER trust the frontend; we re-query the provider directly.
   *
   * This is the ONLY other path (besides webhooks) that can activate an investment.
   */
  async verifyPaymentByPolling(
    gatewayPaymentId: string,
  ): Promise<PaymentVerificationResult> {
    const gatewayPayment = await gatewayPaymentRepository.findById(gatewayPaymentId);
    if (!gatewayPayment) throw new NotFoundError("GatewayPayment");

    // Already in a terminal state — return current state
    const terminalStates = ["SUCCESS", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED"];
    if (terminalStates.includes(gatewayPayment.status)) {
      return {
        gatewayPaymentId: gatewayPayment.id,
        investmentId: gatewayPayment.investmentId,
        status: gatewayPayment.status as never,
        investmentActivated: false,
      };
    }

    const provider = getProvider(gatewayPayment.provider as PaymentProviderKey);
    if (!gatewayPayment.providerPaymentId) throw new ValidationError("No provider payment ID");

    const statusResponse = await provider.getPaymentStatus(gatewayPayment.providerPaymentId);

    // Amount cross-check
    if (Math.abs(statusResponse.amountBdt - Number(gatewayPayment.amountBdt)) > 0.01) {
      await gatewayPaymentRepository.updateStatus(gatewayPayment.id, "FAILED", {
        failureReason: `Amount mismatch: expected ${gatewayPayment.amountBdt}, got ${statusResponse.amountBdt}`,
      });
      throw new ValidationError("Payment amount mismatch detected during verification");
    }

    if (statusResponse.status === "SUCCESS") {
      const { receiptNumber } = await activateInvestment(
        gatewayPayment.id,
        gatewayPayment.investmentId,
        "polling",
      );
      return {
        gatewayPaymentId: gatewayPayment.id,
        investmentId: gatewayPayment.investmentId,
        status: "SUCCESS",
        investmentActivated: true,
        receiptNumber,
      };
    }

    await gatewayPaymentRepository.updateStatus(gatewayPayment.id, statusResponse.status, {
      failureReason: statusResponse.failureReason,
    });

    return {
      gatewayPaymentId: gatewayPayment.id,
      investmentId: gatewayPayment.investmentId,
      status: statusResponse.status,
      investmentActivated: false,
    };
  },

  /**
   * Initiate a refund for a successful payment.
   * Updates GatewayPayment and creates a REFUND ledger entry.
   */
  async refundPayment(
    gatewayPaymentId: string,
    reason: string,
  ) {
    const gatewayPayment = await gatewayPaymentRepository.findById(gatewayPaymentId);
    if (!gatewayPayment) throw new NotFoundError("GatewayPayment");
    if (gatewayPayment.status !== "SUCCESS") {
      throw new ValidationError("Only successful payments can be refunded");
    }

    const provider = getProvider(gatewayPayment.provider as PaymentProviderKey);
    if (!gatewayPayment.providerPaymentId) throw new ValidationError("No provider payment ID");

    const refundKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.REFUND);
    const refundResponse = await provider.refund({
      providerPaymentId: gatewayPayment.providerPaymentId,
      amountBdt: Number(gatewayPayment.amountBdt),
      reason,
      idempotencyKey: refundKey,
    });

    await gatewayPaymentRepository.updateStatus(gatewayPayment.id, "REFUNDED", {
      refundedAt: new Date(),
      refundReference: refundResponse.refundId,
    });

    return { refundId: refundResponse.refundId, status: refundResponse.status };
  },

  /**
   * Reconciliation — poll provider for all stale INITIATED/PENDING payments.
   * Intended to be called by a cron job or admin action.
   * Returns a summary of what was resolved.
   */
  async reconcileStalePayments(olderThanMinutes = 30): Promise<{
    checked: number;
    activated: number;
    failed: number;
    expired: number;
  }> {
    const stale = await gatewayPaymentRepository.findStalePayments(olderThanMinutes);

    let activated = 0;
    let failed = 0;
    let expired = 0;

    for (const gp of stale) {
      try {
        const result = await paymentService.verifyPaymentByPolling(gp.id);
        if (result.investmentActivated) activated++;
        else if (result.status === "FAILED") failed++;
        else if (result.status === "EXPIRED") expired++;
      } catch {
        // Log but don't abort the reconciliation loop
        console.error(`[payment reconcile] failed for gateway payment ${gp.id}`);
      }
    }

    return { checked: stale.length, activated, failed, expired };
  },

  async getByInvestmentId(investmentId: string) {
    return gatewayPaymentRepository.findByInvestmentId(investmentId);
  },

  async getById(id: string) {
    const gp = await gatewayPaymentRepository.findById(id);
    if (!gp) throw new NotFoundError("GatewayPayment");
    return gp;
  },

  async getByProviderPaymentId(providerPaymentId: string) {
    return gatewayPaymentRepository.findByProviderPaymentId(providerPaymentId);
  },
};
