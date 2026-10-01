import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/lib/errors";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDb = {
  kyc: { findUnique: vi.fn() },
  investorProfile: { findUnique: vi.fn() },
  investment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  project: { update: vi.fn() },
  wallet: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  payment: { create: vi.fn(), updateMany: vi.fn() },
  ledgerTransaction: { create: vi.fn() },
  investmentContract: { create: vi.fn() },
  notification: { create: vi.fn() },
  rolePermission: { findFirst: vi.fn() },
  user: { findFirst: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/db/prisma", () => ({ db: mockDb }));

const mockInvestmentRepo = {
  findById: vi.fn(),
  findByIdempotencyKey: vi.fn(),
  findByInvestorAndProject: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  incrementProjectFunding: vi.fn(),
  decrementProjectFunding: vi.fn(),
};

vi.mock("@/db/repositories/investment.repository", () => ({
  investmentRepository: mockInvestmentRepo,
}));

// Mock authz — default: permission granted
vi.mock("@/lib/authz", () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
  can: vi.fn().mockResolvedValue(true),
}));

const { investmentService } = await import("@/server/services/investment.service");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const investorSession = {
  id: "user-investor-1",
  email: "investor@example.com",
  name: "Test Investor",
  phone: null,
  role: "INVESTOR" as const,
  status: "ACTIVE",
  emailVerified: true,
};

const staffSession = {
  id: "user-staff-1",
  email: "staff@example.com",
  name: "Staff User",
  phone: null,
  role: "FINANCE_OFFICER" as const,
  status: "ACTIVE",
  emailVerified: true,
};

const baseProject = {
  id: "project-1",
  status: "FUNDRAISING",
  funding_goal_bdt: "500000.00",
  funded_amount_bdt: "100000.00",
  min_investment_bdt: "5000.00",
  max_investment_bdt: null,
  expected_return_pct: "15.0000",
  return_type: "FIXED_RETURN",
  funding_deadline: new Date(Date.now() + 86400000 * 30),
};

const baseInvestment = {
  id: "inv-1",
  investorProfileId: "profile-1",
  projectId: "project-1",
  status: "PENDING",
  amountBdt: { toString: () => "10000.00" },
  expectedReturnBdt: { toString: () => "1500.00" },
  actualReturnBdt: null,
  returnType: "FIXED_RETURN",
  idempotencyKey: "idem-key-abc123",
  receiptNumber: null,
  paymentPendingAt: null,
  confirmedAt: null,
  activatedAt: null,
  maturedAt: null,
  cancelledAt: null,
  refundedAt: null,
  completedAt: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: {
    id: "project-1",
    title: "Rice Farm Project",
    slug: "rice-farm-project",
    status: "FUNDRAISING",
    fundingGoalBdt: "500000.00",
    fundedAmountBdt: "100000.00",
    minInvestmentBdt: "5000.00",
    maxInvestmentBdt: null,
    expectedReturnPct: "15.0000",
    returnType: "FIXED_RETURN",
    durationDays: 180,
    fundingDeadline: new Date(Date.now() + 86400000 * 30),
  },
  investorProfile: {
    id: "profile-1",
    userId: "user-investor-1",
    user: { id: "user-investor-1", name: "Test Investor", email: "investor@example.com" },
  },
  contract: null,
};

// ─── investmentService.create ─────────────────────────────────────────────────

describe("investmentService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.kyc.findUnique.mockResolvedValue({ status: "VERIFIED" });
    mockInvestmentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDb.investorProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    mockDb.$queryRaw.mockResolvedValue([baseProject]);
    mockDb.investment.findFirst.mockResolvedValue(null);
    mockDb.investment.create.mockResolvedValue({
      id: "inv-1",
      investorProfileId: "profile-1",
      projectId: "project-1",
      status: "PENDING",
      amountBdt: "10000.00",
      expectedReturnBdt: "1500.00",
      returnType: "FIXED_RETURN",
      idempotencyKey: "idem-key-abc123",
      createdAt: new Date(),
      project: baseInvestment.project,
    });
    mockDb.$transaction.mockImplementation((fn: (tx: typeof mockDb) => Promise<unknown>) =>
      fn(mockDb),
    );
  });

  it("creates a PENDING investment with server-calculated return", async () => {
    const result = await investmentService.create(investorSession, {
      projectId: "project-1",
      amountBdt: 10000,
      paymentMethod: "BANK_TRANSFER",
      idempotencyKey: "idem-key-abc123",
    });

    expect(result.idempotent).toBe(false);
    expect(mockDb.investment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountBdt: 10000,
          // 10000 * 15% = 1500
          expectedReturnBdt: 1500,
          status: "PENDING",
          idempotencyKey: "idem-key-abc123",
        }),
      }),
    );
  });

  it("returns existing investment for duplicate idempotency key", async () => {
    mockInvestmentRepo.findByIdempotencyKey.mockResolvedValue(baseInvestment);

    const result = await investmentService.create(investorSession, {
      projectId: "project-1",
      amountBdt: 10000,
      paymentMethod: "BANK_TRANSFER",
      idempotencyKey: "idem-key-abc123",
    });

    expect(result.idempotent).toBe(true);
    expect(result.investment.id).toBe("inv-1");
    // Must NOT create a new investment
    expect(mockDb.investment.create).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when idempotency key belongs to different investor", async () => {
    mockInvestmentRepo.findByIdempotencyKey.mockResolvedValue({
      ...baseInvestment,
      investorProfileId: "profile-OTHER",
      investorProfile: {
        id: "profile-OTHER",
        userId: "user-OTHER",
        user: { id: "user-OTHER", name: "Other", email: "other@example.com" },
      },
    });
    mockDb.investorProfile.findUnique.mockResolvedValue({ id: "profile-1" });

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-abc123",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when KYC is not VERIFIED", async () => {
    mockDb.kyc.findUnique.mockResolvedValue({ status: "PENDING" });

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when KYC record does not exist", async () => {
    mockDb.kyc.findUnique.mockResolvedValue(null);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when project does not exist", async () => {
    mockDb.$queryRaw.mockResolvedValue([]);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-nonexistent",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when project is not FUNDRAISING", async () => {
    mockDb.$queryRaw.mockResolvedValue([{ ...baseProject, status: "FUNDED" }]);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when funding deadline has passed", async () => {
    mockDb.$queryRaw.mockResolvedValue([
      { ...baseProject, funding_deadline: new Date(Date.now() - 1000) },
    ]);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when amount is below minimum", async () => {
    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 1000, // min is 5000
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when amount exceeds maximum", async () => {
    mockDb.$queryRaw.mockResolvedValue([
      { ...baseProject, max_investment_bdt: "50000.00" },
    ]);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 100000, // max is 50000
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ConflictError when project is fully funded", async () => {
    mockDb.$queryRaw.mockResolvedValue([
      { ...baseProject, funded_amount_bdt: "500000.00" }, // fully funded
    ]);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("throws ValidationError when amount exceeds remaining capacity", async () => {
    mockDb.$queryRaw.mockResolvedValue([
      { ...baseProject, funded_amount_bdt: "490000.00" }, // only 10000 remaining
    ]);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 20000, // exceeds remaining 10000
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ConflictError when investor already has active investment in project", async () => {
    mockDb.investment.findFirst.mockResolvedValue({ id: "inv-existing", status: "ACTIVE" });

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("calculates expected return server-side, ignoring any client value", async () => {
    await investmentService.create(investorSession, {
      projectId: "project-1",
      amountBdt: 20000,
      paymentMethod: "BANK_TRANSFER",
      idempotencyKey: "idem-key-abc123",
    });

    expect(mockDb.investment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountBdt: 20000,
          expectedReturnBdt: 3000, // 20000 * 15% = 3000
        }),
      }),
    );
  });

  it("throws ForbiddenError when investor profile does not exist", async () => {
    mockDb.investorProfile.findUnique.mockResolvedValue(null);

    await expect(
      investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: 10000,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: "idem-key-xyz",
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ─── investmentService.cancel ─────────────────────────────────────────────────

describe("investmentService.cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvestmentRepo.findById.mockResolvedValue(baseInvestment);
    mockDb.rolePermission.findFirst.mockResolvedValue(null); // not staff by default
    mockDb.investment.update.mockResolvedValue({ ...baseInvestment, status: "CANCELLED" });
    mockDb.notification.create.mockResolvedValue({});
    mockDb.$transaction.mockImplementation((fn: (tx: typeof mockDb) => Promise<unknown>) =>
      fn(mockDb),
    );
  });

  it("allows investor to cancel their own PENDING investment", async () => {
    const result = await investmentService.cancel(investorSession, {
      investmentId: "inv-1",
      reason: "Changed my mind",
    });

    expect(mockDb.investment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED",
          cancellationReason: "Changed my mind",
        }),
      }),
    );
    expect(result.status).toBe("CANCELLED");
  });

  it("allows investor to cancel PAYMENT_PENDING investment", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({
      ...baseInvestment,
      status: "PAYMENT_PENDING",
    });

    await expect(
      investmentService.cancel(investorSession, {
        investmentId: "inv-1",
        reason: "Payment issue",
      }),
    ).resolves.not.toThrow();
  });

  it("throws ValidationError when investor tries to cancel ACTIVE investment", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({
      ...baseInvestment,
      status: "ACTIVE",
    });

    await expect(
      investmentService.cancel(investorSession, {
        investmentId: "inv-1",
        reason: "Want to cancel",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ForbiddenError when investor tries to cancel another investor's investment", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({
      ...baseInvestment,
      investorProfile: {
        id: "profile-OTHER",
        userId: "user-OTHER",
        user: { id: "user-OTHER", name: "Other", email: "other@example.com" },
      },
    });

    await expect(
      investmentService.cancel(investorSession, {
        investmentId: "inv-1",
        reason: "Unauthorized cancel",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("allows staff to cancel ACTIVE investment", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({
      ...baseInvestment,
      status: "ACTIVE",
    });
    mockDb.rolePermission.findFirst.mockResolvedValue({ id: "rp-1" }); // staff has permission
    mockDb.wallet.findUnique.mockResolvedValue({ id: "wallet-1", cachedBalance: "10000.00" });
    mockDb.wallet.findFirst.mockResolvedValue({ id: "escrow-1", cachedBalance: "50000.00" });
    mockDb.ledgerTransaction.create.mockResolvedValue({ id: "lt-1" });
    mockDb.wallet.update.mockResolvedValue({});
    mockDb.project.update.mockResolvedValue({});

    await expect(
      investmentService.cancel(staffSession, {
        investmentId: "inv-1",
        reason: "Admin cancellation",
      }),
    ).resolves.not.toThrow();
  });

  it("throws NotFoundError when investment does not exist", async () => {
    mockInvestmentRepo.findById.mockResolvedValue(null);

    await expect(
      investmentService.cancel(investorSession, {
        investmentId: "inv-nonexistent",
        reason: "Cancel",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when trying to cancel MATURED investment", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({
      ...baseInvestment,
      status: "MATURED",
    });

    await expect(
      investmentService.cancel(investorSession, {
        investmentId: "inv-1",
        reason: "Too late",
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ─── investmentService.mature ─────────────────────────────────────────────────

describe("investmentService.mature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvestmentRepo.findById.mockResolvedValue({ ...baseInvestment, status: "ACTIVE" });
    mockInvestmentRepo.updateStatus.mockResolvedValue({ ...baseInvestment, status: "MATURED" });
  });

  it("matures an ACTIVE investment with actual return", async () => {
    const result = await investmentService.mature(staffSession, "inv-1", 1600);

    expect(mockInvestmentRepo.updateStatus).toHaveBeenCalledWith(
      "inv-1",
      "MATURED",
      expect.objectContaining({ actualReturnBdt: 1600 }),
    );
    expect(result.status).toBe("MATURED");
  });

  it("throws ValidationError when investment is not ACTIVE", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({ ...baseInvestment, status: "PENDING" });

    await expect(
      investmentService.mature(staffSession, "inv-1", 1600),
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when investment does not exist", async () => {
    mockInvestmentRepo.findById.mockResolvedValue(null);

    await expect(
      investmentService.mature(staffSession, "inv-nonexistent", 1600),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── investmentService.complete ───────────────────────────────────────────────

describe("investmentService.complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvestmentRepo.findById.mockResolvedValue({ ...baseInvestment, status: "MATURED" });
    mockInvestmentRepo.updateStatus.mockResolvedValue({ ...baseInvestment, status: "COMPLETED" });
  });

  it("completes a MATURED investment", async () => {
    const result = await investmentService.complete(staffSession, "inv-1");

    expect(mockInvestmentRepo.updateStatus).toHaveBeenCalledWith(
      "inv-1",
      "COMPLETED",
      expect.objectContaining({ completedAt: expect.any(Date) }),
    );
    expect(result.status).toBe("COMPLETED");
  });

  it("throws ValidationError when investment is not MATURED", async () => {
    mockInvestmentRepo.findById.mockResolvedValue({ ...baseInvestment, status: "ACTIVE" });

    await expect(
      investmentService.complete(staffSession, "inv-1"),
    ).rejects.toThrow(ValidationError);
  });
});

// ─── investmentService.getById ────────────────────────────────────────────────

describe("investmentService.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvestmentRepo.findById.mockResolvedValue(baseInvestment);
  });

  it("returns investment for the owning investor", async () => {
    const result = await investmentService.getById(investorSession, "inv-1");
    expect(result.id).toBe("inv-1");
  });

  it("throws NotFoundError when investment does not exist", async () => {
    mockInvestmentRepo.findById.mockResolvedValue(null);

    await expect(
      investmentService.getById(investorSession, "inv-nonexistent"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── Return calculation ───────────────────────────────────────────────────────

describe("expected return calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.kyc.findUnique.mockResolvedValue({ status: "VERIFIED" });
    mockInvestmentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDb.investorProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    mockDb.investment.findFirst.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation((fn: (tx: typeof mockDb) => Promise<unknown>) =>
      fn(mockDb),
    );
    mockDb.investment.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...data, id: "inv-new", createdAt: new Date(), project: baseInvestment.project }),
    );
  });

  const cases = [
    { amount: 10000, pct: "15.0000", expected: 1500 },
    { amount: 50000, pct: "12.5000", expected: 6250 },
    { amount: 7777, pct: "10.0000", expected: 777.7 },
    { amount: 100000, pct: "8.7500", expected: 8750 },
  ];

  for (const { amount, pct, expected } of cases) {
    it(`calculates ${amount} * ${pct}% = ${expected}`, async () => {
      mockDb.$queryRaw.mockResolvedValue([
        { ...baseProject, expected_return_pct: pct },
      ]);

      await investmentService.create(investorSession, {
        projectId: "project-1",
        amountBdt: amount,
        paymentMethod: "BANK_TRANSFER",
        idempotencyKey: `key-${amount}-${pct}`,
      });

      expect(mockDb.investment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expectedReturnBdt: expected }),
        }),
      );
    });
  }
});
