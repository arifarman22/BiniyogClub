import { db } from "@/lib/db/prisma";
import type { WalletType, Prisma } from "@/types/prisma";

// ─── Select shapes ────────────────────────────────────────────────────────────

export const walletSelect = {
  id: true,
  userId: true,
  type: true,
  cachedBalance: true,
  currency: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WalletSelect;

// ─── Repository ───────────────────────────────────────────────────────────────

export const walletRepository = {
  async findByUserId(userId: string) {
    return db.wallet.findUnique({ where: { userId }, select: walletSelect });
  },

  async findByType(type: WalletType) {
    return db.wallet.findFirst({ where: { type }, select: walletSelect });
  },

  async findById(id: string) {
    return db.wallet.findUnique({ where: { id }, select: walletSelect });
  },

  /** Get or create a wallet for a user. Must be called inside a transaction. */
  async getOrCreate(
    tx: Prisma.TransactionClient,
    userId: string,
    type: WalletType,
  ) {
    const existing = await tx.wallet.findUnique({
      where: { userId },
      select: walletSelect,
    });
    if (existing) return existing;

    return tx.wallet.create({
      data: { userId, type, cachedBalance: 0, currency: "BDT" },
      select: walletSelect,
    });
  },

  /**
   * Lock a wallet row for update (SELECT FOR UPDATE).
   * Returns the current cachedBalance under the lock.
   * Must be called inside a serializable transaction.
   */
  async lockForUpdate(
    tx: Prisma.TransactionClient,
    walletId: string,
  ): Promise<{ id: string; cachedBalance: string; isActive: boolean }> {
    const [row] = await tx.$queryRaw<
      Array<{ id: string; cached_balance: string; is_active: boolean }>
    >`
      SELECT id, cached_balance, is_active
      FROM wallets
      WHERE id = ${walletId}
      FOR UPDATE
    `;
    if (!row) throw new Error(`Wallet ${walletId} not found`);
    return {
      id: row.id,
      cachedBalance: row.cached_balance,
      isActive: row.is_active,
    };
  },

  /** Update the cached balance snapshot. Must be called inside a transaction. */
  async updateCachedBalance(
    tx: Prisma.TransactionClient,
    walletId: string,
    newBalance: number,
  ) {
    return tx.wallet.update({
      where: { id: walletId },
      data: { cachedBalance: newBalance },
      select: { id: true, cachedBalance: true },
    });
  },

  /** Save a reconciliation snapshot. */
  async saveSnapshot(
    tx: Prisma.TransactionClient,
    walletId: string,
    balanceBdt: number,
    lastLedgerEntryId: string,
  ) {
    return tx.walletSnapshot.create({
      data: { walletId, balanceBdt, ledgerEntryId: lastLedgerEntryId },
      select: { id: true, balanceBdt: true, createdAt: true },
    });
  },

  /** Get the most recent snapshot for a wallet. */
  async getLatestSnapshot(walletId: string) {
    return db.walletSnapshot.findFirst({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      select: { id: true, balanceBdt: true, ledgerEntryId: true, createdAt: true },
    });
  },
};
