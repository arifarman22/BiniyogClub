import { db } from "@/lib/db/prisma";
import type { Prisma, LedgerTransactionType } from "@/types/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerEntryInput = {
  walletId: string;
  entryType: "DEBIT" | "CREDIT";
  amountBdt: number;
  balanceAfterBdt: number;
};

export type CreateLedgerTxInput = {
  type: LedgerTransactionType;
  description: string;
  amountBdt: number;
  currency?: string;
  investmentId?: string;
  referenceId?: string;
  referenceType?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  entries: [LedgerEntryInput, LedgerEntryInput]; // always exactly two
};

// ─── Select shapes ────────────────────────────────────────────────────────────

export const ledgerTxSelect = {
  id: true,
  type: true,
  status: true,
  description: true,
  amountBdt: true,
  currency: true,
  idempotencyKey: true,
  referenceId: true,
  referenceType: true,
  investmentId: true,
  metadata: true,
  postedAt: true,
  voidedAt: true,
  voidReason: true,
  entries: {
    select: {
      id: true,
      walletId: true,
      entryType: true,
      amountBdt: true,
      balanceAfterBdt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LedgerTransactionSelect;

// ─── Repository ───────────────────────────────────────────────────────────────

export const ledgerRepository = {
  /**
   * Create a double-entry ledger transaction with exactly two entries.
   * Must be called inside a db.$transaction() for atomicity.
   */
  async createTransaction(
    tx: Prisma.TransactionClient,
    input: CreateLedgerTxInput,
  ) {
    return tx.ledgerTransaction.create({
      data: {
        type: input.type,
        status: "POSTED",
        description: input.description,
        amountBdt: input.amountBdt,
        currency: input.currency ?? "BDT",
        idempotencyKey: input.idempotencyKey ?? null,
        referenceId: input.referenceId ?? null,
        referenceType: input.referenceType ?? null,
        investmentId: input.investmentId ?? null,
        metadata: input.metadata ?? null,
        entries: {
          create: input.entries.map((e) => ({
            walletId: e.walletId,
            entryType: e.entryType,
            amountBdt: e.amountBdt,
            balanceAfterBdt: e.balanceAfterBdt,
          })),
        },
      },
      select: ledgerTxSelect,
    });
  },

  /** Find a transaction by its idempotency key. */
  async findByIdempotencyKey(key: string) {
    return db.ledgerTransaction.findUnique({
      where: { idempotencyKey: key },
      select: ledgerTxSelect,
    });
  },

  /** Void a posted transaction (creates a reversal — does NOT delete). */
  async voidTransaction(
    tx: Prisma.TransactionClient,
    id: string,
    reason: string,
  ) {
    return tx.ledgerTransaction.update({
      where: { id },
      data: { status: "VOIDED", voidedAt: new Date(), voidReason: reason },
      select: { id: true, status: true },
    });
  },

  /**
   * Derive the true balance for a wallet by summing all POSTED ledger entries.
   * This is the authoritative balance — never use cachedBalance for decisions.
   */
  async deriveBalance(walletId: string): Promise<number> {
    const result = await db.ledgerEntry.aggregate({
      where: {
        walletId,
        ledgerTransaction: { status: "POSTED" },
      },
      _sum: { amountBdt: true },
      // We need separate sums for CREDIT and DEBIT
    });

    // Separate aggregation for credits and debits
    const [credits, debits] = await Promise.all([
      db.ledgerEntry.aggregate({
        where: { walletId, entryType: "CREDIT", ledgerTransaction: { status: "POSTED" } },
        _sum: { amountBdt: true },
      }),
      db.ledgerEntry.aggregate({
        where: { walletId, entryType: "DEBIT", ledgerTransaction: { status: "POSTED" } },
        _sum: { amountBdt: true },
      }),
    ]);

    const totalCredits = Number(credits._sum.amountBdt ?? 0);
    const totalDebits = Number(debits._sum.amountBdt ?? 0);
    return Math.round((totalCredits - totalDebits) * 100) / 100;
  },

  /** Get paginated ledger entries for a wallet. */
  async getWalletHistory(
    walletId: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      db.ledgerEntry.findMany({
        where: { walletId },
        select: {
          id: true,
          entryType: true,
          amountBdt: true,
          balanceAfterBdt: true,
          createdAt: true,
          ledgerTransaction: {
            select: {
              id: true,
              type: true,
              status: true,
              description: true,
              referenceId: true,
              referenceType: true,
              postedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.ledgerEntry.count({ where: { walletId } }),
    ]);
    return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
