/**
 * wallet.service.ts
 *
 * User-facing wallet operations: deposit, withdrawal request/approval,
 * balance queries, and transaction history.
 *
 * All balance-changing operations delegate to ledgerService for the
 * actual double-entry writes. This service handles:
 *  - Authorization
 *  - Payment record management
 *  - Withdrawal lifecycle
 *  - Notifications
 */

import { db } from "@/lib/db/prisma";
import { ledgerService } from "./ledger.service";
import { walletRepository } from "@/db/repositories/wallet.repository";
import { ledgerRepository } from "@/db/repositories/ledger.repository";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { assertPositiveBdt, calculateNetReturn } from "@/lib/financial/money";
import { generateIdempotencyKey, IDEMPOTENCY_PREFIXES } from "@/lib/financial/idempotency";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type {
  DepositInput,
  WithdrawalRequestInput,
  ApproveWithdrawalInput,
  AdjustmentInput,
} from "@/validations/wallet";
import type { Prisma } from "@/types/prisma";

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function assertWalletOwner(session: SessionUser, walletId: string): Promise<void> {
  const wallet = await walletRepository.findById(walletId);
  if (!wallet) throw new NotFoundError("Wallet");
  if (wallet.userId !== session.id) {
    throw new ForbiddenError("You do not have access to this wallet");
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const walletService = {
  /**
   * Get or create the wallet for the current user.
   * Safe to call on every dashboard load.
   */
  async getOrCreateWallet(session: SessionUser) {
    return db.$transaction(async (tx) => {
      return walletRepository.getOrCreate(tx, session.id, "INVESTOR");
    });
  },

  /**
   * Get wallet with true ledger-derived balance.
   * cachedBalance is shown for speed; trueBalance is shown for accuracy.
   */
  async getWalletWithBalance(session: SessionUser) {
    const wallet = await walletRepository.findByUserId(session.id);
    if (!wallet) {
      return { wallet: null, trueBalance: 0, cachedBalance: 0 };
    }
    const trueBalance = await ledgerService.getTrueBalance(wallet.id);
    return {
      wallet,
      trueBalance,
      cachedBalance: Number(wallet.cachedBalance),
    };
  },

  /**
   * Record a confirmed deposit (called after payment gateway confirms).
   * Creates a Payment record and posts a DEPOSIT ledger transaction.
   */
  async recordDeposit(session: SessionUser, input: DepositInput) {
    assertPositiveBdt(input.amountBdt, "Deposit amount");

    // Idempotency: check if this payment reference was already processed
    const existingPayment = await db.payment.findFirst({
      where: {
        wallet: { userId: session.id },
        externalReference: input.externalReference,
        status: "COMPLETED",
      },
      select: { id: true },
    });
    if (existingPayment) {
      throw new ConflictError(
        `Payment reference ${input.externalReference} has already been processed`,
      );
    }

    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.DEPOSIT);

    return db.$transaction(
      async (tx) => {
        const wallet = await walletRepository.getOrCreate(tx, session.id, "INVESTOR");

        // Create payment record
        const payment = await tx.payment.create({
          data: {
            walletId: wallet.id,
            direction: "INBOUND",
            method: input.paymentMethod as Prisma.PaymentCreateInput["method"],
            status: "COMPLETED",
            amountBdt: input.amountBdt,
            feeBdt: 0,
            netAmountBdt: input.amountBdt,
            currency: "BDT",
            idempotencyKey,
            externalReference: input.externalReference,
            gatewayResponse: input.gatewayResponse ? JSON.parse(JSON.stringify(input.gatewayResponse)) : undefined,
            description: input.description ?? "Wallet deposit",
            processedAt: new Date(),
          },
          select: { id: true },
        });

        // Post ledger entry
        const { ledgerTx } = await ledgerService.recordDeposit(session.id, input.amountBdt, {
          idempotencyKey,
          referenceId: payment.id,
          description: input.description ?? "Wallet deposit",
          metadata: { paymentId: payment.id, externalReference: input.externalReference } as Record<string, string>,
        });

        // Notify
        await tx.notification.create({
          data: {
            userId: session.id,
            type: "PAYMENT_RECEIVED",
            title: "Deposit Confirmed",
            body: `৳${input.amountBdt.toLocaleString("en-BD")} has been added to your wallet.`,
            data: { paymentId: payment.id, amountBdt: input.amountBdt },
          },
        });

        return { payment, ledgerTx };
      },
      { isolationLevel: "Serializable" },
    );
  },

  /**
   * Request a withdrawal. Reserves funds immediately via ledger.
   * Actual bank transfer happens after staff approval.
   */
  async requestWithdrawal(session: SessionUser, input: WithdrawalRequestInput) {
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_REQUEST);
    assertPositiveBdt(input.amountBdt, "Withdrawal amount");

    const wallet = await walletRepository.findByUserId(session.id);
    if (!wallet) throw new NotFoundError("Wallet");
    if (!wallet.isActive) throw new ValidationError("Wallet is not active");

    // Check true balance (not cached) to prevent double-spending
    const trueBalance = await ledgerService.getTrueBalance(wallet.id);
    const totalAmount = input.amountBdt + (input.feeBdt ?? 0);

    if (trueBalance < totalAmount) {
      throw new ValidationError(
        `Insufficient balance. Available: ৳${trueBalance.toFixed(2)}, Requested: ৳${totalAmount.toFixed(2)}`,
      );
    }

    // Check for pending withdrawals that would exhaust balance
    const pendingWithdrawals = await db.withdrawal.aggregate({
      where: {
        walletId: wallet.id,
        status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
      },
      _sum: { amountBdt: true },
    });
    const pendingTotal = Number(pendingWithdrawals._sum.amountBdt ?? 0);
    if (trueBalance - pendingTotal < totalAmount) {
      throw new ValidationError(
        `Insufficient available balance after pending withdrawals. Available: ৳${(trueBalance - pendingTotal).toFixed(2)}`,
      );
    }

    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.WITHDRAWAL);
    const feeBdt = input.feeBdt ?? 0;
    const netAmountBdt = input.amountBdt - feeBdt;

    return db.$transaction(
      async (tx) => {
        const withdrawal = await tx.withdrawal.create({
          data: {
            walletId: wallet.id,
            status: "PENDING",
            amountBdt: input.amountBdt,
            feeBdt,
            netAmountBdt,
            method: input.method as Prisma.WithdrawalCreateInput["method"],
            bankName: input.bankName ?? null,
            accountNumber: input.accountNumber ?? null,
            accountName: input.accountName ?? null,
            mobileNumber: input.mobileNumber ?? null,
            idempotencyKey,
          },
          select: {
            id: true,
            status: true,
            amountBdt: true,
            netAmountBdt: true,
            method: true,
            createdAt: true,
          },
        });

        // Reserve funds immediately via ledger
        const { ledgerTx } = await ledgerService.recordWithdrawalRequest(
          session.id,
          input.amountBdt,
          {
            withdrawalId: withdrawal.id,
            idempotencyKey,
            description: `Withdrawal request: ${input.method}`,
            metadata: { withdrawalId: withdrawal.id },
          },
        );

        // Link ledger transaction to withdrawal
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: { ledgerTransactionId: ledgerTx.id },
        });

        await tx.notification.create({
          data: {
            userId: session.id,
            type: "WITHDRAWAL_APPROVED",
            title: "Withdrawal Requested",
            body: `Your withdrawal of ৳${input.amountBdt.toLocaleString("en-BD")} is pending approval.`,
            data: { withdrawalId: withdrawal.id },
          },
        });

        return { withdrawal, ledgerTx };
      },
      { isolationLevel: "Serializable" },
    );
  },

  /**
   * Approve a withdrawal request (Finance Officer / Admin).
   * Moves status to APPROVED; actual processing is separate.
   */
  async approveWithdrawal(session: SessionUser, input: ApproveWithdrawalInput) {
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_APPROVE);

    const withdrawal = await db.withdrawal.findUnique({
      where: { id: input.withdrawalId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        walletId: true,
        wallet: { select: { userId: true } },
      },
    });
    if (!withdrawal) throw new NotFoundError("Withdrawal");
    if (withdrawal.status !== "PENDING") {
      throw new ValidationError(`Cannot approve withdrawal in status: ${withdrawal.status}`);
    }

    const updated = await db.withdrawal.update({
      where: { id: input.withdrawalId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: session.id,
      },
      select: { id: true, status: true, amountBdt: true },
    });

    await db.notification.create({
      data: {
        userId: withdrawal.wallet.userId,
        type: "WITHDRAWAL_APPROVED",
        title: "Withdrawal Approved",
        body: `Your withdrawal of ৳${Number(withdrawal.amountBdt).toLocaleString("en-BD")} has been approved.`,
        data: { withdrawalId: withdrawal.id },
      },
    });

    return updated;
  },

  /**
   * Complete a withdrawal (Finance Officer marks bank transfer done).
   * No additional ledger entry needed — funds were already reserved on request.
   */
  async completeWithdrawal(session: SessionUser, withdrawalId: string) {
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_APPROVE);

    const withdrawal = await db.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        wallet: { select: { userId: true } },
      },
    });
    if (!withdrawal) throw new NotFoundError("Withdrawal");
    if (withdrawal.status !== "APPROVED") {
      throw new ValidationError(`Cannot complete withdrawal in status: ${withdrawal.status}`);
    }

    const updated = await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "COMPLETED", completedAt: new Date(), processedAt: new Date() },
      select: { id: true, status: true },
    });

    await db.notification.create({
      data: {
        userId: withdrawal.wallet.userId,
        type: "WITHDRAWAL_COMPLETED",
        title: "Withdrawal Completed",
        body: `Your withdrawal of ৳${Number(withdrawal.amountBdt).toLocaleString("en-BD")} has been sent to your account.`,
        data: { withdrawalId },
      },
    });

    return updated;
  },

  /**
   * Reject a withdrawal and refund the reserved funds.
   * Creates a REFUND ledger entry to restore the investor's balance.
   */
  async rejectWithdrawal(session: SessionUser, withdrawalId: string, reason: string) {
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_APPROVE);

    const withdrawal = await db.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        ledgerTransactionId: true,
        wallet: { select: { id: true, userId: true } },
      },
    });
    if (!withdrawal) throw new NotFoundError("Withdrawal");
    if (!["PENDING", "APPROVED"].includes(withdrawal.status)) {
      throw new ValidationError(`Cannot reject withdrawal in status: ${withdrawal.status}`);
    }

    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.REFUND);

    return db.$transaction(
      async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason },
        });

        // Reverse the reservation ledger entry
        const { ledgerTx } = await ledgerService.recordRefund(
          withdrawal.wallet.userId,
          Number(withdrawal.amountBdt),
          {
            referenceId: withdrawalId,
            referenceType: "Withdrawal",
            idempotencyKey,
            description: `Withdrawal rejection refund: ${reason}`,
            metadata: { withdrawalId, reason },
          },
        );

        await tx.notification.create({
          data: {
            userId: withdrawal.wallet.userId,
            type: "SYSTEM",
            title: "Withdrawal Rejected",
            body: `Your withdrawal request was rejected. Reason: ${reason}. Funds have been returned to your wallet.`,
            data: { withdrawalId, reason },
          },
        });

        return { ledgerTx };
      },
      { isolationLevel: "Serializable" },
    );
  },

  /**
   * Manual balance adjustment (Finance Officer / Admin only).
   * Requires explicit authorization and description for audit trail.
   */
  async adjustBalance(session: SessionUser, input: AdjustmentInput) {
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const targetUser = await db.user.findUnique({
      where: { id: input.userId, deletedAt: null },
      select: { id: true },
    });
    if (!targetUser) throw new NotFoundError("User");

    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.ADJUSTMENT);

    return ledgerService.recordAdjustment(input.userId, input.amountBdt, {
      idempotencyKey,
      description: input.description,
      authorizedBy: session.id,
      metadata: { authorizedBy: session.id, reason: input.description },
    });
  },

  /**
   * Get paginated transaction history for the current user's wallet.
   */
  async getTransactionHistory(session: SessionUser, page = 1, limit = 50) {
    const wallet = await walletRepository.findByUserId(session.id);
    if (!wallet) return { entries: [], total: 0, page, limit, totalPages: 0 };
    return ledgerRepository.getWalletHistory(wallet.id, page, limit);
  },

  /**
   * Reconcile the current user's wallet balance.
   * Returns discrepancy between ledger-derived and cached balance.
   */
  async reconcile(session: SessionUser) {
    const wallet = await walletRepository.findByUserId(session.id);
    if (!wallet) throw new NotFoundError("Wallet");
    return ledgerService.reconcileWallet(wallet.id, false);
  },

  /**
   * Admin: reconcile any wallet and optionally fix the cached balance.
   */
  async adminReconcile(session: SessionUser, walletId: string, fix = false) {
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);
    return ledgerService.reconcileWallet(walletId, fix);
  },

  /**
   * Distribute profit to an investor after project completion.
   * Called by the investment service during the DISTRIBUTION stage.
   * Handles both the net distribution and the platform fee in one call.
   */
  async distributeProfit(
    investorUserId: string,
    grossReturnBdt: number,
    opts: {
      investmentId: string;
      projectTitle: string;
    },
  ) {
    assertPositiveBdt(grossReturnBdt, "Gross return");

    const { gross, fee, net } = calculateNetReturn(grossReturnBdt);

    const distKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.DISTRIBUTION);
    const feeKey  = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.FEE);

    // Post distribution (net amount to investor)
    const { ledgerTx: distTx } = await ledgerService.recordDistribution(
      investorUserId,
      net,
      {
        investmentId: opts.investmentId,
        idempotencyKey: distKey,
        projectTitle: opts.projectTitle,
        metadata: { gross, fee, net },
      },
    );

    // Post platform fee
    const { ledgerTx: feeTx } = await ledgerService.recordPlatformFee(fee, {
      investmentId: opts.investmentId,
      idempotencyKey: feeKey,
      description: `Platform fee: ${opts.projectTitle}`,
      metadata: { gross, fee, net },
    });

    return { distTx, feeTx, gross, fee, net };
  },
};
