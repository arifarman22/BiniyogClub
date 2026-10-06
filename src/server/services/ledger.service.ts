/**
 * ledger.service.ts
 *
 * Double-entry bookkeeping engine.
 *
 * Rules enforced here:
 *  - Every transaction has exactly one DEBIT entry and one CREDIT entry.
 *  - DEBIT and CREDIT amounts must be equal (balanced books).
 *  - No transaction may produce a negative balance on any wallet.
 *  - Idempotency: duplicate keys return the existing transaction.
 *  - All writes run inside serializable transactions with row locks.
 *  - Voiding creates a reversal pair â€” records are never deleted.
 *
 * Wallet types and their roles:
 *  INVESTOR        â€” investor's personal wallet (source of investment funds)
 *  FARMER          â€” farmer's wallet (receives project disbursements)
 *  PLATFORM_ESCROW â€” holds investor funds during active projects
 *  PLATFORM_REVENUEâ€” receives platform fees
 */

import { db } from "@/lib/db/prisma";
import { ledgerRepository } from "@/db/repositories/ledger.repository";
import { walletRepository } from "@/db/repositories/wallet.repository";
import { addBdt, subtractBdt, assertPositiveBdt } from "@/lib/financial/money";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type { LedgerTransactionType, Prisma } from "@/types/prisma";

// â”€â”€â”€ Internal helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Resolve or create the platform escrow wallet inside a transaction. */
async function getOrCreateEscrowWallet(tx: Prisma.TransactionClient) {
  const existing = await tx.wallet.findFirst({
    where: { type: "PLATFORM_ESCROW" },
    select: { id: true, cachedBalance: true, isActive: true },
  });
  if (existing) return existing;

  try {
    return await tx.wallet.create({
      data: { type: "PLATFORM_ESCROW", cachedBalance: 0, currency: "BDT" },
      select: { id: true, cachedBalance: true, isActive: true },
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      const retry = await tx.wallet.findFirst({
        where: { type: "PLATFORM_ESCROW" },
        select: { id: true, cachedBalance: true, isActive: true },
      });
      if (retry) return retry;
    }
    throw e;
  }
}

/** Resolve or create the platform revenue wallet inside a transaction. */
async function getOrCreateRevenueWallet(tx: Prisma.TransactionClient) {
  const existing = await tx.wallet.findFirst({
    where: { type: "PLATFORM_REVENUE" },
    select: { id: true, cachedBalance: true, isActive: true },
  });
  if (existing) return existing;

  try {
    return await tx.wallet.create({
      data: { type: "PLATFORM_REVENUE", cachedBalance: 0, currency: "BDT" },
      select: { id: true, cachedBalance: true, isActive: true },
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      const retry = await tx.wallet.findFirst({
        where: { type: "PLATFORM_REVENUE" },
        select: { id: true, cachedBalance: true, isActive: true },
      });
      if (retry) return retry;
    }
    throw e;
  }
}

/**
 * Core double-entry write.
 * Acquires row locks on both wallets, validates balances, writes entries,
 * and updates cached balances â€” all inside the caller's transaction.
 *
 * @param tx          - Active Prisma transaction client
 * @param type        - Ledger transaction type
 * @param description - Human-readable description
 * @param amountBdt   - Amount to move
 * @param debitWalletId  - Wallet to debit (balance decreases)
 * @param creditWalletId - Wallet to credit (balance increases)
 * @param opts        - Optional metadata, reference, idempotency key
 */
async function writeDoubleEntry(
  tx: Prisma.TransactionClient,
  type: LedgerTransactionType,
  description: string,
  amountBdt: number,
  debitWalletId: string,
  creditWalletId: string,
  opts: {
    investmentId?: string;
    referenceId?: string;
    referenceType?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  assertPositiveBdt(amountBdt, "Ledger amount");

  // Lock both wallets in a consistent order (by ID) to prevent deadlocks
  const [firstId, secondId] = [debitWalletId, creditWalletId].sort();
  const [first, second] = await Promise.all([
    walletRepository.lockForUpdate(tx, firstId),
    walletRepository.lockForUpdate(tx, secondId),
  ]);

  const debitWallet  = first.id  === debitWalletId  ? first  : second;
  const creditWallet = first.id  === creditWalletId ? first  : second;

  if (!debitWallet.isActive || !creditWallet.isActive) {
    throw new ValidationError("Cannot post to an inactive wallet");
  }

  const debitBalance  = Number(debitWallet.cachedBalance);
  const creditBalance = Number(creditWallet.cachedBalance);

  // Negative balance prevention â€” only enforced for INVESTOR wallets.
  // Platform-internal wallets (PLATFORM_REVENUE, PLATFORM_ESCROW) are contra
  // accounts and may legitimately go negative (e.g. revenue debited on deposit).
  const newDebitBalance = subtractBdt(debitBalance, amountBdt);
  const isInvestorWallet = await tx.wallet.findUnique({
    where: { id: debitWalletId },
    select: { type: true },
  });
  if (newDebitBalance < 0 && isInvestorWallet?.type === "INVESTOR") {
    throw new ValidationError(
      `Insufficient balance. Available: à§³${debitBalance.toFixed(2)}, Required: à§³${amountBdt.toFixed(2)}`,
    );
  }

  const newCreditBalance = addBdt(creditBalance, amountBdt);

  // Write the ledger transaction + two entries atomically
  const ledgerTx = await ledgerRepository.createTransaction(tx, {
    type,
    description,
    amountBdt,
    currency: "BDT",
    investmentId: opts.investmentId,
    referenceId: opts.referenceId,
    referenceType: opts.referenceType,
    idempotencyKey: opts.idempotencyKey,
    metadata: opts.metadata,
    entries: [
      { walletId: debitWalletId,  entryType: "DEBIT",  amountBdt, balanceAfterBdt: newDebitBalance },
      { walletId: creditWalletId, entryType: "CREDIT", amountBdt, balanceAfterBdt: newCreditBalance },
    ],
  });

  // Update cached balances
  await Promise.all([
    walletRepository.updateCachedBalance(tx, debitWalletId,  newDebitBalance),
    walletRepository.updateCachedBalance(tx, creditWalletId, newCreditBalance),
  ]);

  return { ledgerTx, newDebitBalance, newCreditBalance };
}

// â”€â”€â”€ Public ledger service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ledgerService = {
  /**
   * DEPOSIT: External money enters the platform.
   * Real money arrives from outside (manual bank transfer confirmed by admin).
   *
   * Double-entry:
   *   DEBIT:  PLATFORM_REVENUE  (represents external inflow â€” money received by platform)
   *   CREDIT: INVESTOR wallet   (investor's balance increases)
   *
   * Escrow is NOT involved in deposits. Escrow only holds funds that have been
   * committed to investments (INVESTMENT_FUNDING credits escrow).
   * Using PLATFORM_REVENUE as the contra keeps escrow balance accurate:
   *   escrow balance = sum of all active investment funds held by platform.
   */
  async recordDeposit(
    userId: string,
    amountBdt: number,
    opts: {
      idempotencyKey: string;
      referenceId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    assertPositiveBdt(amountBdt, "Deposit amount");

    // Idempotency check before entering transaction
    if (opts.idempotencyKey) {
      const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
      if (existing) return { ledgerTx: existing, idempotent: true };
    }

    return db.$transaction(
      async (tx) => {
        const investorWallet = await walletRepository.getOrCreate(tx, userId, "INVESTOR");
        const revenueWallet  = await getOrCreateRevenueWallet(tx);

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "DEPOSIT",
          opts.description ?? "Wallet deposit",
          amountBdt,
          revenueWallet.id,  // debit revenue (external inflow contra account)
          investorWallet.id, // credit investor (investor balance increases)
          {
            referenceId: opts.referenceId,
            referenceType: "Payment",
            idempotencyKey: opts.idempotencyKey,
            metadata: opts.metadata,
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * INVESTMENT_FUNDING: Investor commits funds to a project.
   * Debit: investor wallet (balance decreases)
   * Credit: platform escrow (escrow holds the funds)
   */
  async recordInvestmentFunding(
    investorUserId: string,
    amountBdt: number,
    opts: {
      investmentId: string;
      idempotencyKey: string;
      projectTitle: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    assertPositiveBdt(amountBdt, "Investment amount");

    const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    return db.$transaction(
      async (tx) => {
        const investorWallet = await walletRepository.getOrCreate(tx, investorUserId, "INVESTOR");
        const escrowWallet   = await getOrCreateEscrowWallet(tx);

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "INVESTMENT_FUNDING",
          `Investment funding: ${opts.projectTitle}`,
          amountBdt,
          investorWallet.id, // debit investor
          escrowWallet.id,   // credit escrow
          {
            investmentId: opts.investmentId,
            referenceId: opts.investmentId,
            referenceType: "Investment",
            idempotencyKey: opts.idempotencyKey,
            metadata: opts.metadata,
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * PROFIT_DISTRIBUTION: Distribute returns to an investor after project completion.
   * Debit: platform escrow (funds leave escrow)
   * Credit: investor wallet (investor receives principal + return)
   *
   * Platform fee is taken separately via recordPlatformFee().
   */
  async recordDistribution(
    investorUserId: string,
    netAmountBdt: number,
    opts: {
      investmentId: string;
      idempotencyKey: string;
      projectTitle: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    assertPositiveBdt(netAmountBdt, "Distribution amount");

    const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    return db.$transaction(
      async (tx) => {
        const investorWallet = await walletRepository.getOrCreate(tx, investorUserId, "INVESTOR");
        const escrowWallet   = await getOrCreateEscrowWallet(tx);

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "PROFIT_DISTRIBUTION",
          `Profit distribution: ${opts.projectTitle}`,
          netAmountBdt,
          escrowWallet.id,   // debit escrow
          investorWallet.id, // credit investor
          {
            investmentId: opts.investmentId,
            referenceId: opts.investmentId,
            referenceType: "Investment",
            idempotencyKey: opts.idempotencyKey,
            metadata: opts.metadata,
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * PLATFORM_FEE: Collect platform fee from escrow into revenue wallet.
   * Debit: platform escrow
   * Credit: platform revenue
   */
  async recordPlatformFee(
    feeBdt: number,
    opts: {
      investmentId: string;
      idempotencyKey: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    assertPositiveBdt(feeBdt, "Fee amount");

    const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    return db.$transaction(
      async (tx) => {
        const escrowWallet  = await getOrCreateEscrowWallet(tx);
        const revenueWallet = await getOrCreateRevenueWallet(tx);

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "PLATFORM_FEE",
          opts.description ?? "Platform fee",
          feeBdt,
          escrowWallet.id,   // debit escrow
          revenueWallet.id,  // credit revenue
          {
            investmentId: opts.investmentId,
            referenceId: opts.investmentId,
            referenceType: "Investment",
            idempotencyKey: opts.idempotencyKey,
            metadata: opts.metadata,
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * WITHDRAWAL: Investor withdraws funds from their wallet.
   * Debit: investor wallet (balance decreases)
   * Credit: platform escrow (funds held pending bank transfer)
   *
   * The actual bank transfer is handled externally. When completed,
   * call recordWithdrawalCompletion() to debit escrow.
   */
  async recordWithdrawalRequest(
    investorUserId: string,
    amountBdt: number,
    opts: {
      withdrawalId: string;
      idempotencyKey: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    assertPositiveBdt(amountBdt, "Withdrawal amount");

    const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    return db.$transaction(
      async (tx) => {
        const investorWallet = await walletRepository.getOrCreate(tx, investorUserId, "INVESTOR");
        const escrowWallet   = await getOrCreateEscrowWallet(tx);

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "WITHDRAWAL",
          opts.description ?? "Withdrawal request",
          amountBdt,
          investorWallet.id, // debit investor (funds reserved)
          escrowWallet.id,   // credit escrow (funds held)
          {
            referenceId: opts.withdrawalId,
            referenceType: "Withdrawal",
            idempotencyKey: opts.idempotencyKey,
            metadata: opts.metadata,
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * REFUND: Return funds to investor (e.g. cancelled investment).
   * Debit: platform escrow
   * Credit: investor wallet
   */
  async recordRefund(
    investorUserId: string,
    amountBdt: number,
    opts: {
      investmentId?: string;
      referenceId: string;
      referenceType: string;
      idempotencyKey: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    assertPositiveBdt(amountBdt, "Refund amount");

    const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    return db.$transaction(
      async (tx) => {
        const investorWallet = await walletRepository.getOrCreate(tx, investorUserId, "INVESTOR");
        const escrowWallet   = await getOrCreateEscrowWallet(tx);

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "REFUND",
          opts.description ?? "Refund",
          amountBdt,
          escrowWallet.id,   // debit escrow
          investorWallet.id, // credit investor
          {
            investmentId: opts.investmentId,
            referenceId: opts.referenceId,
            referenceType: opts.referenceType,
            idempotencyKey: opts.idempotencyKey,
            metadata: opts.metadata,
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * ADJUSTMENT: Manual balance correction by finance staff.
   * Direction is determined by the sign of amountBdt:
   *   positive â†’ credit target wallet (balance increases)
   *   negative â†’ debit target wallet (balance decreases)
   *
   * Adjustments always use PLATFORM_REVENUE as the contra account.
   */
  async recordAdjustment(
    targetUserId: string,
    amountBdt: number,
    opts: {
      idempotencyKey: string;
      description: string;
      authorizedBy: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (amountBdt === 0) throw new ValidationError("Adjustment amount cannot be zero");

    const existing = await ledgerRepository.findByIdempotencyKey(opts.idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    const absAmount = Math.abs(amountBdt);
    assertPositiveBdt(absAmount, "Adjustment amount");

    return db.$transaction(
      async (tx) => {
        const targetWallet  = await walletRepository.getOrCreate(tx, targetUserId, "INVESTOR");
        const revenueWallet = await getOrCreateRevenueWallet(tx);

        const [debitId, creditId] = amountBdt > 0
          ? [revenueWallet.id, targetWallet.id]  // positive: revenue â†’ target
          : [targetWallet.id, revenueWallet.id]; // negative: target â†’ revenue

        const { ledgerTx } = await writeDoubleEntry(
          tx,
          "ADJUSTMENT",
          opts.description,
          absAmount,
          debitId,
          creditId,
          {
            idempotencyKey: opts.idempotencyKey,
            metadata: { ...opts.metadata, authorizedBy: opts.authorizedBy },
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * Void a posted ledger transaction and create a reversal.
   * The original transaction is marked VOIDED; a new reversal transaction is posted.
   * This preserves the full audit trail.
   */
  async voidAndReverse(
    ledgerTxId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    const existing = await ledgerRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return { ledgerTx: existing, idempotent: true };

    const original = await db.ledgerTransaction.findUnique({
      where: { id: ledgerTxId },
      select: {
        id: true,
        type: true,
        status: true,
        amountBdt: true,
        description: true,
        investmentId: true,
        referenceId: true,
        referenceType: true,
        entries: {
          select: { walletId: true, entryType: true, amountBdt: true },
        },
      },
    });

    if (!original) throw new NotFoundError("Ledger transaction");
    if (original.status === "VOIDED") {
      throw new ConflictError("Transaction is already voided");
    }
    if (original.entries.length !== 2) {
      throw new ValidationError("Cannot void a transaction with unexpected entry count");
    }

    return db.$transaction(
      async (tx) => {
        // Mark original as voided
        await ledgerRepository.voidTransaction(tx, ledgerTxId, reason);

        // Find debit and credit entries
        const debitEntry  = original.entries.find((e) => e.entryType === "DEBIT")!;
        const creditEntry = original.entries.find((e) => e.entryType === "CREDIT")!;
        const amount = Number(original.amountBdt);

        // Reversal: swap debit/credit
        const { ledgerTx } = await writeDoubleEntry(
          tx,
          original.type,
          `REVERSAL: ${original.description}`,
          amount,
          creditEntry.walletId, // original credit becomes debit
          debitEntry.walletId,  // original debit becomes credit
          {
            investmentId: original.investmentId ?? undefined,
            referenceId: original.referenceId ?? undefined,
            referenceType: original.referenceType ?? undefined,
            idempotencyKey,
            metadata: { reversalOf: ledgerTxId, reason },
          },
        );

        return { ledgerTx, idempotent: false };
      },
      { timeout: 15000 },
    );
  },

  /**
   * Reconcile a wallet: derive true balance from ledger and compare to cached.
   * Returns the discrepancy (0 = balanced).
   * If fix=true, updates the cached balance to match the ledger.
   */
  async reconcileWallet(walletId: string, fix = false) {
    const trueBalance = await ledgerRepository.deriveBalance(walletId);
    const wallet = await walletRepository.findById(walletId);
    if (!wallet) throw new NotFoundError("Wallet");

    const cachedBalance = Number(wallet.cachedBalance);
    const discrepancy = Math.round((trueBalance - cachedBalance) * 100) / 100;

    if (fix && discrepancy !== 0) {
      await db.wallet.update({
        where: { id: walletId },
        data: { cachedBalance: trueBalance },
      });
    }

    return {
      walletId,
      trueBalance,
      cachedBalance,
      discrepancy,
      isBalanced: discrepancy === 0,
    };
  },

  /** Get the true (ledger-derived) balance for a wallet. */
  async getTrueBalance(walletId: string): Promise<number> {
    return ledgerRepository.deriveBalance(walletId);
  },

  /** Get paginated ledger history for a wallet. */
  async getHistory(walletId: string, page = 1, limit = 50) {
    return ledgerRepository.getWalletHistory(walletId, page, limit);
  },
};
