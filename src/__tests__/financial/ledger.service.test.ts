import { describe, it, expect, vi, beforeEach } from "vitest";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLedgerRepo = {
  createTransaction: vi.fn(),
  findByIdempotencyKey: vi.fn(),
  voidTransaction: vi.fn(),
  deriveBalance: vi.fn(),
  getWalletHistory: vi.fn(),
};

const mockWalletRepo = {
  findByUserId: vi.fn(),
  findByType: vi.fn(),
  findById: vi.fn(),
  getOrCreate: vi.fn(),
  lockForUpdate: vi.fn(),
  updateCachedBalance: vi.fn(),
  saveSnapshot: vi.fn(),
  getLatestSnapshot: vi.fn(),
};

vi.mock("@/db/repositories/ledger.repository", () => ({
  ledgerRepository: mockLedgerRepo,
}));

vi.mock("@/db/repositories/wallet.repository", () => ({
  walletRepository: mockWalletRepo,
}));

const mockDb = {
  wallet: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  user: { findFirst: vi.fn() },
  ledgerTransaction: { findUnique: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/db/prisma", () => ({ db: mockDb }));

const { ledgerService } = await import("@/server/services/ledger.service");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const investorWallet  = { id: "wallet-investor",  cachedBalance: "50000.00", isActive: true };
const escrowWallet    = { id: "wallet-escrow",    cachedBalance: "200000.00", isActive: true };
const revenueWallet   = { id: "wallet-revenue",   cachedBalance: "5000.00",  isActive: true };

const baseLedgerTx = {
  id: "ltx-1",
  type: "INVESTMENT_FUNDING",
  status: "POSTED",
  description: "Test",
  amountBdt: "10000.00",
  currency: "BDT",
  idempotencyKey: "inv_key123",
  referenceId: "inv-1",
  referenceType: "Investment",
  investmentId: "inv-1",
  metadata: null,
  postedAt: new Date(),
  voidedAt: null,
  voidReason: null,
  entries: [
    { id: "e1", walletId: "wallet-investor", entryType: "DEBIT",  amountBdt: "10000.00", balanceAfterBdt: "40000.00", createdAt: new Date() },
    { id: "e2", walletId: "wallet-escrow",   entryType: "CREDIT", amountBdt: "10000.00", balanceAfterBdt: "210000.00", createdAt: new Date() },
  ],
};

function setupTxMock() {
  mockDb.$transaction.mockImplementation(
    (fn: (tx: typeof mockDb) => Promise<unknown>) => fn(mockDb),
  );
}

// ─── recordInvestmentFunding ──────────────────────────────────────────────────

describe("ledgerService.recordInvestmentFunding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTxMock();
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockWalletRepo.getOrCreate.mockResolvedValue(investorWallet);
    mockDb.wallet.findFirst.mockResolvedValue(escrowWallet);
    mockWalletRepo.lockForUpdate
      .mockResolvedValueOnce({ id: "wallet-escrow",    cachedBalance: "200000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-investor",  cachedBalance: "50000.00",  isActive: true });
    mockLedgerRepo.createTransaction.mockResolvedValue(baseLedgerTx);
    mockWalletRepo.updateCachedBalance.mockResolvedValue({});
  });

  it("creates a double-entry ledger transaction", async () => {
    const result = await ledgerService.recordInvestmentFunding("user-1", 10000, {
      investmentId: "inv-1",
      idempotencyKey: "inv_key123",
      projectTitle: "Rice Farm",
    });

    expect(result.idempotent).toBe(false);
    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "INVESTMENT_FUNDING",
        amountBdt: 10000,
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "DEBIT",  walletId: "wallet-investor" }),
          expect.objectContaining({ entryType: "CREDIT", walletId: "wallet-escrow" }),
        ]),
      }),
    );
  });

  it("returns existing transaction for duplicate idempotency key", async () => {
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(baseLedgerTx);

    const result = await ledgerService.recordInvestmentFunding("user-1", 10000, {
      investmentId: "inv-1",
      idempotencyKey: "inv_key123",
      projectTitle: "Rice Farm",
    });

    expect(result.idempotent).toBe(true);
    expect(mockLedgerRepo.createTransaction).not.toHaveBeenCalled();
  });

  it("updates cached balances on both wallets", async () => {
    await ledgerService.recordInvestmentFunding("user-1", 10000, {
      investmentId: "inv-1",
      idempotencyKey: "inv_key_new",
      projectTitle: "Rice Farm",
    });

    expect(mockWalletRepo.updateCachedBalance).toHaveBeenCalledTimes(2);
  });

  it("throws ValidationError when investor has insufficient balance", async () => {
    mockWalletRepo.lockForUpdate
      .mockReset()
      .mockResolvedValueOnce({ id: "wallet-escrow",   cachedBalance: "200000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "5000.00",   isActive: true }); // only 5000
    mockDb.wallet.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ type: where.id === "wallet-investor" ? "INVESTOR" : "PLATFORM_ESCROW" }),
    );

    await expect(
      ledgerService.recordInvestmentFunding("user-1", 10000, {
        investmentId: "inv-1",
        idempotencyKey: "inv_key_new2",
        projectTitle: "Rice Farm",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when wallet is inactive", async () => {
    mockWalletRepo.lockForUpdate
      .mockReset()
      .mockResolvedValueOnce({ id: "wallet-escrow",   cachedBalance: "200000.00", isActive: false })
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "50000.00",  isActive: true });

    await expect(
      ledgerService.recordInvestmentFunding("user-1", 10000, {
        investmentId: "inv-1",
        idempotencyKey: "inv_key_new3",
        projectTitle: "Rice Farm",
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ─── recordDeposit ────────────────────────────────────────────────────────────

describe("ledgerService.recordDeposit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTxMock();
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockWalletRepo.getOrCreate.mockResolvedValue(investorWallet);
    mockDb.wallet.findFirst.mockResolvedValue(escrowWallet);
    mockWalletRepo.lockForUpdate
      .mockResolvedValueOnce({ id: "wallet-escrow",   cachedBalance: "200000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "50000.00",  isActive: true });
    mockLedgerRepo.createTransaction.mockResolvedValue({ ...baseLedgerTx, type: "DEPOSIT" });
    mockWalletRepo.updateCachedBalance.mockResolvedValue({});
  });

  it("credits investor wallet on deposit", async () => {
    await ledgerService.recordDeposit("user-1", 5000, {
      idempotencyKey: "dep_key123",
      referenceId: "pay-1",
    });

    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "DEPOSIT",
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "CREDIT", walletId: "wallet-investor" }),
          expect.objectContaining({ entryType: "DEBIT",  walletId: "wallet-escrow" }),
        ]),
      }),
    );
  });

  it("throws for zero amount", async () => {
    await expect(
      ledgerService.recordDeposit("user-1", 0, { idempotencyKey: "dep_key_zero" }),
    ).rejects.toThrow();
  });

  it("throws for negative amount", async () => {
    await expect(
      ledgerService.recordDeposit("user-1", -100, { idempotencyKey: "dep_key_neg" }),
    ).rejects.toThrow();
  });
});

// ─── recordRefund ─────────────────────────────────────────────────────────────

describe("ledgerService.recordRefund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTxMock();
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockWalletRepo.getOrCreate.mockResolvedValue(investorWallet);
    mockDb.wallet.findFirst.mockResolvedValue(escrowWallet);
    mockWalletRepo.lockForUpdate
      .mockResolvedValueOnce({ id: "wallet-escrow",   cachedBalance: "200000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "50000.00",  isActive: true });
    mockLedgerRepo.createTransaction.mockResolvedValue({ ...baseLedgerTx, type: "REFUND" });
    mockWalletRepo.updateCachedBalance.mockResolvedValue({});
  });

  it("credits investor and debits escrow on refund", async () => {
    await ledgerService.recordRefund("user-1", 10000, {
      referenceId: "inv-1",
      referenceType: "Investment",
      idempotencyKey: "ref_key123",
    });

    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "REFUND",
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "DEBIT",  walletId: "wallet-escrow" }),
          expect.objectContaining({ entryType: "CREDIT", walletId: "wallet-investor" }),
        ]),
      }),
    );
  });
});

// ─── recordPlatformFee ────────────────────────────────────────────────────────

describe("ledgerService.recordPlatformFee", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTxMock();
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDb.wallet.findFirst
      .mockResolvedValueOnce(escrowWallet)
      .mockResolvedValueOnce(revenueWallet);
    mockWalletRepo.lockForUpdate
      .mockResolvedValueOnce({ id: "wallet-escrow",   cachedBalance: "200000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-revenue",  cachedBalance: "5000.00",   isActive: true });
    mockLedgerRepo.createTransaction.mockResolvedValue({ ...baseLedgerTx, type: "PLATFORM_FEE" });
    mockWalletRepo.updateCachedBalance.mockResolvedValue({});
  });

  it("debits escrow and credits revenue wallet", async () => {
    await ledgerService.recordPlatformFee(250, {
      investmentId: "inv-1",
      idempotencyKey: "fee_key123",
    });

    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "PLATFORM_FEE",
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "DEBIT",  walletId: "wallet-escrow" }),
          expect.objectContaining({ entryType: "CREDIT", walletId: "wallet-revenue" }),
        ]),
      }),
    );
  });
});

// ─── recordAdjustment ────────────────────────────────────────────────────────

describe("ledgerService.recordAdjustment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTxMock();
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockWalletRepo.getOrCreate.mockResolvedValue(investorWallet);
    mockDb.wallet.findFirst.mockResolvedValue(revenueWallet);
    mockWalletRepo.lockForUpdate
      .mockResolvedValueOnce({ id: "wallet-revenue",  cachedBalance: "5000.00",  isActive: true })
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "50000.00", isActive: true });
    mockLedgerRepo.createTransaction.mockResolvedValue({ ...baseLedgerTx, type: "ADJUSTMENT" });
    mockWalletRepo.updateCachedBalance.mockResolvedValue({});
  });

  it("credits target wallet for positive adjustment", async () => {
    await ledgerService.recordAdjustment("user-1", 500, {
      idempotencyKey: "adj_key_pos",
      description: "Manual credit adjustment",
      authorizedBy: "admin-1",
    });

    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "ADJUSTMENT",
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "CREDIT", walletId: "wallet-investor" }),
        ]),
      }),
    );
  });

  it("debits target wallet for negative adjustment", async () => {
    mockWalletRepo.lockForUpdate
      .mockReset()
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "50000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-revenue",  cachedBalance: "5000.00",  isActive: true });

    await ledgerService.recordAdjustment("user-1", -500, {
      idempotencyKey: "adj_key_neg",
      description: "Manual debit adjustment",
      authorizedBy: "admin-1",
    });

    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "ADJUSTMENT",
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "DEBIT", walletId: "wallet-investor" }),
        ]),
      }),
    );
  });

  it("throws ValidationError for zero adjustment", async () => {
    await expect(
      ledgerService.recordAdjustment("user-1", 0, {
        idempotencyKey: "adj_key_zero",
        description: "Zero adjustment",
        authorizedBy: "admin-1",
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ─── voidAndReverse ───────────────────────────────────────────────────────────

describe("ledgerService.voidAndReverse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTxMock();
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDb.ledgerTransaction.findUnique.mockResolvedValue({
      ...baseLedgerTx,
      entries: [
        { walletId: "wallet-investor", entryType: "DEBIT",  amountBdt: "10000.00" },
        { walletId: "wallet-escrow",   entryType: "CREDIT", amountBdt: "10000.00" },
      ],
    });
    mockLedgerRepo.voidTransaction.mockResolvedValue({ id: "ltx-1", status: "VOIDED" });
    mockWalletRepo.lockForUpdate
      .mockResolvedValueOnce({ id: "wallet-escrow",   cachedBalance: "210000.00", isActive: true })
      .mockResolvedValueOnce({ id: "wallet-investor", cachedBalance: "40000.00",  isActive: true });
    mockLedgerRepo.createTransaction.mockResolvedValue({ ...baseLedgerTx, id: "ltx-reversal" });
    mockWalletRepo.updateCachedBalance.mockResolvedValue({});
  });

  it("voids original and creates reversal with swapped entries", async () => {
    const result = await ledgerService.voidAndReverse("ltx-1", "Error correction", "void_key123");

    expect(mockLedgerRepo.voidTransaction).toHaveBeenCalledWith(
      expect.anything(), "ltx-1", "Error correction",
    );
    // Reversal: original CREDIT wallet becomes DEBIT, original DEBIT wallet becomes CREDIT
    expect(mockLedgerRepo.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ entryType: "DEBIT",  walletId: "wallet-escrow" }),
          expect.objectContaining({ entryType: "CREDIT", walletId: "wallet-investor" }),
        ]),
      }),
    );
    expect(result.idempotent).toBe(false);
  });

  it("returns existing reversal for duplicate idempotency key", async () => {
    mockLedgerRepo.findByIdempotencyKey.mockResolvedValue(baseLedgerTx);

    const result = await ledgerService.voidAndReverse("ltx-1", "Error", "void_key_dup");

    expect(result.idempotent).toBe(true);
    expect(mockLedgerRepo.voidTransaction).not.toHaveBeenCalled();
  });

  it("throws ConflictError when transaction is already voided", async () => {
    mockDb.ledgerTransaction.findUnique.mockResolvedValue({
      ...baseLedgerTx,
      status: "VOIDED",
    });

    await expect(
      ledgerService.voidAndReverse("ltx-1", "Double void", "void_key_new"),
    ).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError when transaction does not exist", async () => {
    mockDb.ledgerTransaction.findUnique.mockResolvedValue(null);

    await expect(
      ledgerService.voidAndReverse("ltx-nonexistent", "Void", "void_key_nf"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── reconcileWallet ─────────────────────────────────────────────────────────

describe("ledgerService.reconcileWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports balanced wallet", async () => {
    mockLedgerRepo.deriveBalance.mockResolvedValue(50000);
    mockWalletRepo.findById.mockResolvedValue({ ...investorWallet, cachedBalance: "50000.00" });

    const result = await ledgerService.reconcileWallet("wallet-investor");

    expect(result.isBalanced).toBe(true);
    expect(result.discrepancy).toBe(0);
    expect(result.trueBalance).toBe(50000);
  });

  it("detects discrepancy between ledger and cached balance", async () => {
    mockLedgerRepo.deriveBalance.mockResolvedValue(50100); // ledger says 50100
    mockWalletRepo.findById.mockResolvedValue({ ...investorWallet, cachedBalance: "50000.00" }); // cache says 50000

    const result = await ledgerService.reconcileWallet("wallet-investor");

    expect(result.isBalanced).toBe(false);
    expect(result.discrepancy).toBe(100);
  });

  it("fixes cached balance when fix=true", async () => {
    mockLedgerRepo.deriveBalance.mockResolvedValue(50100);
    mockWalletRepo.findById.mockResolvedValue({ ...investorWallet, cachedBalance: "50000.00" });
    mockDb.wallet.update.mockResolvedValue({});

    await ledgerService.reconcileWallet("wallet-investor", true);

    expect(mockDb.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { cachedBalance: 50100 },
      }),
    );
  });

  it("does not fix when fix=false (default)", async () => {
    mockLedgerRepo.deriveBalance.mockResolvedValue(50100);
    mockWalletRepo.findById.mockResolvedValue({ ...investorWallet, cachedBalance: "50000.00" });

    await ledgerService.reconcileWallet("wallet-investor", false);

    expect(mockDb.wallet.update).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when wallet does not exist", async () => {
    mockLedgerRepo.deriveBalance.mockResolvedValue(0);
    mockWalletRepo.findById.mockResolvedValue(null);

    await expect(
      ledgerService.reconcileWallet("wallet-nonexistent"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── Negative balance prevention ─────────────────────────────────────────────
// The balance check in writeDoubleEntry is: subtractBdt(balance, amount) < 0.
// We verify the arithmetic is correct here; the integration is covered by the
// "throws ValidationError when investor has insufficient balance" test above
// which already exercises the same code path via the beforeEach mock setup.

describe("negative balance prevention (arithmetic)", () => {
  it("subtractBdt returns negative when amount exceeds balance", async () => {
    const { subtractBdt } = await import("@/lib/financial/money");
    expect(subtractBdt(0, 1)).toBe(-1);
    expect(subtractBdt(9999.99, 10000)).toBe(-0.01);
  });

  it("subtractBdt returns zero when amount equals balance", async () => {
    const { subtractBdt } = await import("@/lib/financial/money");
    expect(subtractBdt(10000, 10000)).toBe(0);
  });

  it("subtractBdt returns positive when balance exceeds amount", async () => {
    const { subtractBdt } = await import("@/lib/financial/money");
    expect(subtractBdt(10001, 10000)).toBe(1);
  });
});
