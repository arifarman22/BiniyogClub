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

// â”€â”€â”€ Internal helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function assertWalletOwner(session: SessionUser, walletId: string): Promise<void> {
  const wallet = await walletRepository.findById(walletId);
  if (!wallet) throw new NotFoundError("Wallet");
  if (wallet.userId !== session.id) {
    throw new ForbiddenError("You do not have access to this wallet");
  }
}

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            externalReference: input.externalReference ?? undefined,
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
          metadata: { paymentId: payment.id, externalReference: input.externalReference ?? "" } as Record<string, string>,
        });

        // Notify
        await tx.notification.create({
          data: {
            userId: session.id,
            type: "PAYMENT_RECEIVED",
            title: "Deposit Confirmed",
            body: `à§³${input.amountBdt.toLocaleString("en-BD")} has been added to your wallet.`,
            data: { paymentId: payment.id, amountBdt: input.amountBdt },
          },
        });

        return { payment, ledgerTx };
      },
      { timeout: 15000 },
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
        `Insufficient balance. Available: à§³${trueBalance.toFixed(2)}, Requested: à§³${totalAmount.toFixed(2)}`,
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
        `Insufficient available balance after pending withdrawals. Available: à§³${(trueBalance - pendingTotal).toFixed(2)}`,
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
            body: `Your withdrawal of à§³${input.amountBdt.toLocaleString("en-BD")} is pending approval.`,
            data: { withdrawalId: withdrawal.id },
          },
        });

        return { withdrawal, ledgerTx };
      },
      { timeout: 15000 },
    );
  },

  /**
   * Investor cancels their own PENDING withdrawal.
   * Reverses the ledger reservation and restores balance.
   */
  async cancelWithdrawal(session: SessionUser, withdrawalId: string) {
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
    if (withdrawal.wallet.userId !== session.id) throw new ForbiddenError("Access denied");
    if (withdrawal.status !== "PENDING") {
      throw new ValidationError(`Only PENDING withdrawals can be cancelled (current: ${withdrawal.status})`);
    }

    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.REFUND);

    return db.$transaction(
      async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: "CANCELLED" },
        });

        // Reverse the ledger reservation
        const { ledgerTx } = await ledgerService.recordRefund(
          session.id,
          Number(withdrawal.amountBdt),
          {
            referenceId: withdrawalId,
            referenceType: "Withdrawal",
            idempotencyKey,
            description: "Withdrawal cancelled by investor",
            metadata: { withdrawalId, cancelledBy: session.id },
          },
        );

        // Audit log
        await tx.auditLog.create({
          data: {
            actorId: session.id,
            action: "UPDATE",
            entityType: "Withdrawal",
            entityId: withdrawalId,
            before: { status: "PENDING" },
            after: { status: "CANCELLED" },
          },
        });

        return { ledgerTx };
      },
      { timeout: 15000 },
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
        userId: withdrawal.wallet.userId ?? "",
        type: "WITHDRAWAL_APPROVED",
        title: "Withdrawal Approved",
        body: `Your withdrawal of à§³${Number(withdrawal.amountBdt).toLocaleString("en-BD")} has been approved.`,
        data: { withdrawalId: withdrawal.id },
      },
    });

    return updated;
  },

  /**
   * Complete a withdrawal (Finance Officer marks bank transfer done).
   * No additional ledger entry needed â€” funds were already reserved on request.
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
        userId: withdrawal.wallet.userId ?? "",
        type: "WITHDRAWAL_COMPLETED",
        title: "Withdrawal Completed",
        body: `Your withdrawal of à§³${Number(withdrawal.amountBdt).toLocaleString("en-BD")} has been sent to your account.`,
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
          withdrawal.wallet.userId ?? "",
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
            userId: withdrawal.wallet.userId ?? "",
            type: "SYSTEM",
            title: "Withdrawal Rejected",
            body: `Your withdrawal request was rejected. Reason: ${reason}. Funds have been returned to your wallet.`,
            data: { withdrawalId, reason },
          },
        });

        return { ledgerTx };
      },
      { timeout: 15000 },
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
   * Invest directly from wallet balance.
   * Validates balance, creates investment, posts ledger entry atomically.
   */
  async investFromWallet(
    session: SessionUser,
    input: { projectId: string; amountBdt: number; idempotencyKey: string },
  ) {
    await requirePermission(session, PERMISSIONS.INVESTMENT_CREATE);
    assertPositiveBdt(input.amountBdt, "Investment amount");

    // KYC check
    const kyc = await db.kyc.findUnique({ where: { userId: session.id }, select: { status: true } });
    if (!kyc || kyc.status !== "VERIFIED") {
      throw new ForbiddenError("KYC verification required before investing.");
    }

    // Idempotency
    const existing = await db.investment.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, receiptNumber: true } });
    if (existing) return { investmentId: existing.id, receiptNumber: existing.receiptNumber ?? "" };

    const wallet = await walletRepository.findByUserId(session.id);
    if (!wallet) throw new NotFoundError("Wallet");
    if (!wallet.isActive) throw new ValidationError("Wallet is not active");

    const trueBalance = await ledgerService.getTrueBalance(wallet.id);
    if (trueBalance < input.amountBdt) {
      throw new ValidationError(
        `Insufficient wallet balance. Available: \u09F3${trueBalance.toFixed(2)}, Required: \u09F3${input.amountBdt.toFixed(2)}`,
      );
    }

    return db.$transaction(
      async (tx) => {
        // Fetch and lock project
        const project = await tx.project.findUnique({
          where: { id: input.projectId },
          select: {
            id: true, title: true, status: true,
            fundingGoalBdt: true, fundedAmountBdt: true,
            minInvestmentBdt: true, maxInvestmentBdt: true,
            expectedReturnPct: true, returnType: true, fundingDeadline: true,
          },
        });
        if (!project) throw new NotFoundError("Project");
        if (project.status !== "FUNDRAISING") throw new ValidationError("Project is not accepting investments");
        if (new Date(project.fundingDeadline) < new Date()) throw new ValidationError("Funding deadline has passed");

        const min = Number(project.minInvestmentBdt);
        const max = project.maxInvestmentBdt ? Number(project.maxInvestmentBdt) : null;
        if (input.amountBdt < min) throw new ValidationError(`Minimum investment is \u09F3${min.toLocaleString("en-BD")}`);
        if (max && input.amountBdt > max) throw new ValidationError(`Maximum investment is \u09F3${max.toLocaleString("en-BD")}`);

        const remaining = Number(project.fundingGoalBdt) - Number(project.fundedAmountBdt);
        if (remaining <= 0) throw new ConflictError("Project is fully funded");
        if (input.amountBdt > remaining) throw new ValidationError(`Only \u09F3${remaining.toLocaleString("en-BD")} remaining`);

        // Duplicate check
        const profile = await tx.investorProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
        if (!profile) throw new ForbiddenError("Investor profile not found");

        const duplicate = await tx.investment.findFirst({
          where: { investorProfileId: profile.id, projectId: input.projectId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError("You already have an active investment in this project");

        const expectedReturnBdt = Math.round(input.amountBdt * (Number(project.expectedReturnPct) / 100) * 100) / 100;
        const receiptNumber = `BC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const now = new Date();

        // Create investment
        const investment = await tx.investment.create({
          data: {
            investorProfileId: profile.id,
            projectId: input.projectId,
            amountBdt: input.amountBdt,
            expectedReturnBdt,
            returnType: project.returnType,
            idempotencyKey: input.idempotencyKey,
            status: "ACTIVE",
            confirmedAt: now,
            activatedAt: now,
            receiptNumber,
          },
          select: { id: true, receiptNumber: true },
        });

        // Post ledger: debit investor wallet, credit escrow
        const { ledgerTx } = await ledgerService.recordInvestmentFunding(
          session.id,
          input.amountBdt,
          {
            investmentId: investment.id,
            idempotencyKey: input.idempotencyKey,
            projectTitle: project.title,
            metadata: { source: "WALLET", walletId: wallet.id },
          },
        );

        // Update project funded amount
        const updated = await tx.project.update({
          where: { id: input.projectId },
          data: { fundedAmountBdt: { increment: input.amountBdt } },
          select: { status: true, fundingGoalBdt: true, fundedAmountBdt: true },
        });
        if (Number(updated.fundedAmountBdt) >= Number(updated.fundingGoalBdt) && updated.status === "FUNDRAISING") {
          await tx.project.update({ where: { id: input.projectId }, data: { status: "FUNDED" } });
        }

        // Contract
        await tx.investmentContract.create({
          data: {
            investmentId: investment.id,
            status: "DRAFT",
            templateVersion: "v1.0",
            terms: { amountBdt: input.amountBdt, expectedReturnBdt, returnType: project.returnType, projectId: input.projectId, projectTitle: project.title, investorId: session.id, activatedAt: now.toISOString(), source: "WALLET" },
          },
        });

        // Notification
        await tx.notification.create({
          data: {
            userId: session.id,
            type: "INVESTMENT_CONFIRMED",
            title: "Investment Confirmed",
            body: `Your wallet investment of \u09F3${input.amountBdt.toLocaleString("en-BD")} has been confirmed. Receipt: ${receiptNumber}`,
            data: { investmentId: investment.id, receiptNumber, source: "WALLET" },
          },
        });

        return { investmentId: investment.id, receiptNumber: investment.receiptNumber ?? "", ledgerTxId: ledgerTx.id }; // receiptNumber is always set above
      },
      { timeout: 15000 },
    );
  },

  /**
   * Admin confirms a pending deposit payment and posts the ledger entry.
   */
  async confirmDeposit(session: SessionUser, paymentId: string) {
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true, amountBdt: true, wallet: { select: { userId: true } } },
    });
    if (!payment) throw new NotFoundError("Payment");
    if (payment.status !== "PENDING") throw new ValidationError(`Payment is already ${payment.status}`);

    const idempotencyKey = generateIdempotencyKey(IDEMPOTENCY_PREFIXES.DEPOSIT);
    const amountBdt = Number(payment.amountBdt);
    const userId = payment.wallet.userId;

    await db.$transaction(
      async (tx) => {
        await tx.payment.update({ where: { id: paymentId }, data: { status: "COMPLETED", processedAt: new Date() } });

        const investorWallet = await walletRepository.getOrCreate(tx, userId, "INVESTOR");
        const revenueWallet = await tx.wallet.findFirst({
          where: { type: "PLATFORM_REVENUE" },
          select: { id: true, cachedBalance: true, isActive: true },
        }) ?? await tx.wallet.create({
          data: { type: "PLATFORM_REVENUE", cachedBalance: 0, currency: "BDT" },
          select: { id: true, cachedBalance: true, isActive: true },
        });

        const [firstId, secondId] = [investorWallet.id, revenueWallet.id].sort();
        const [first, second] = await Promise.all([
          walletRepository.lockForUpdate(tx, firstId),
          walletRepository.lockForUpdate(tx, secondId),
        ]);
        const revenueRow  = first.id === revenueWallet.id  ? first : second;
        const investorRow = first.id === investorWallet.id ? first : second;
        const newRevenueBalance  = Number(revenueRow.cachedBalance)  - amountBdt;
        const newInvestorBalance = Number(investorRow.cachedBalance) + amountBdt;

        await ledgerRepository.createTransaction(tx, {
          type: "DEPOSIT",
          description: "Wallet deposit confirmed by admin",
          amountBdt,
          currency: "BDT",
          idempotencyKey,
          referenceId: paymentId,
          referenceType: "Payment",
          metadata: { paymentId, confirmedBy: session.id },
          entries: [
            { walletId: revenueWallet.id,  entryType: "DEBIT",  amountBdt, balanceAfterBdt: newRevenueBalance },
            { walletId: investorWallet.id, entryType: "CREDIT", amountBdt, balanceAfterBdt: newInvestorBalance },
          ],
        });

        await Promise.all([
          walletRepository.updateCachedBalance(tx, revenueWallet.id,  newRevenueBalance),
          walletRepository.updateCachedBalance(tx, investorWallet.id, newInvestorBalance),
        ]);

        await tx.notification.create({ data: {
          userId,
          type: "PAYMENT_RECEIVED",
          title: "Deposit Confirmed",
          body: `à§³${amountBdt.toLocaleString("en-BD")} has been added to your wallet.`,
          data: { paymentId },
        } });
      },
      { timeout: 15000 },
    );
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
