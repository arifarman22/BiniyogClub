import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCreateMany = vi.fn().mockResolvedValue({ count: 2 });
const mockCreate = vi.fn().mockResolvedValue({ id: "notif-1" });
const mockFindMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  db: {
    notification: { create: (...a: unknown[]) => mockCreate(...a), createMany: (...a: unknown[]) => mockCreateMany(...a) },
    user: { findMany: (...a: unknown[]) => mockFindMany(...a) },
  },
}));

const mockSendEmail = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/email/mailer", () => ({
  sendEmail: (...a: unknown[]) => mockSendEmail(...a),
  emailLayout: (c: string) => `<html>${c}</html>`,
  ctaButton: (href: string, label: string) => `<a href="${href}">${label}</a>`,
}));

vi.mock("@/config/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "https://biniyogclub.com", RESEND_API_KEY: "test", EMAIL_FROM: "noreply@biniyogclub.com" },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { notificationService } from "@/server/services/notification.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adminUsers = [{ id: "admin-1" }, { id: "admin-2" }];
const adminEmails = [{ email: "admin@biniyogclub.com" }, { email: "finance@biniyogclub.com" }];
const investorEmails = [{ email: "investor1@test.com" }, { email: "investor2@test.com" }];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── onInvestmentCreated ──────────────────────────────────────────────────────

describe("notificationService.onInvestmentCreated", () => {
  it("creates in-app notifications for admin roles", async () => {
    mockFindMany.mockResolvedValueOnce(adminUsers).mockResolvedValueOnce(adminEmails);
    await notificationService.onInvestmentCreated("Arif", "Poultry Farm", "proj-1", 50000, "inv-1");
    expect(mockCreateMany).toHaveBeenCalledOnce();
    const call = mockCreateMany.mock.calls[0][0];
    expect(call.data).toHaveLength(2);
    expect(call.data[0].type).toBe("INVESTMENT_CONFIRMED");
    expect(call.data[0].title).toBe("New Investment Submitted");
  });

  it("sends emails to SUPER_ADMIN and FINANCE_OFFICER", async () => {
    mockFindMany.mockResolvedValueOnce(adminUsers).mockResolvedValueOnce(adminEmails);
    await notificationService.onInvestmentCreated("Arif", "Poultry Farm", "proj-1", 50000, "inv-1");
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail.mock.calls[0][0].to).toBe("admin@biniyogclub.com");
    expect(mockSendEmail.mock.calls[0][0].subject).toContain("50,000");
  });

  it("does not throw when no admin users exist", async () => {
    mockFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(notificationService.onInvestmentCreated("Arif", "Farm", "proj-1", 1000, "inv-1")).resolves.not.toThrow();
    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

// ─── onInvestmentApproved ─────────────────────────────────────────────────────

describe("notificationService.onInvestmentApproved", () => {
  it("creates in-app notification for investor", async () => {
    await notificationService.onInvestmentApproved("user-1", "Arif", "arif@test.com", "Poultry Farm", 50000, "RCP-001", "inv-1");
    expect(mockCreate).toHaveBeenCalledOnce();
    const call = mockCreate.mock.calls[0][0];
    expect(call.data.userId).toBe("user-1");
    expect(call.data.type).toBe("INVESTMENT_CONFIRMED");
    expect(call.data.title).toBe("Investment Approved");
    expect(call.data.data).toMatchObject({ investmentId: "inv-1", receiptNumber: "RCP-001" });
  });

  it("sends approval email to investor", async () => {
    await notificationService.onInvestmentApproved("user-1", "Arif", "arif@test.com", "Poultry Farm", 50000, "RCP-001", "inv-1");
    expect(mockSendEmail).toHaveBeenCalledOnce();
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("arif@test.com");
    expect(call.subject).toContain("approved");
    expect(call.html).toContain("RCP-001");
  });
});

// ─── onInvestmentCancelledByAdmin ─────────────────────────────────────────────

describe("notificationService.onInvestmentCancelledByAdmin", () => {
  it("creates in-app notification with cancellation reason", async () => {
    await notificationService.onInvestmentCancelledByAdmin("user-1", "Arif", "arif@test.com", "Poultry Farm", "Incomplete payment", "inv-1");
    expect(mockCreate).toHaveBeenCalledOnce();
    const call = mockCreate.mock.calls[0][0];
    expect(call.data.title).toBe("Investment Cancelled");
    expect(call.data.body).toContain("Incomplete payment");
  });

  it("sends cancellation email with reason", async () => {
    await notificationService.onInvestmentCancelledByAdmin("user-1", "Arif", "arif@test.com", "Poultry Farm", "Incomplete payment", "inv-1");
    expect(mockSendEmail).toHaveBeenCalledOnce();
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("arif@test.com");
    expect(call.html).toContain("Incomplete payment");
  });
});

// ─── onProjectPublished ───────────────────────────────────────────────────────

describe("notificationService.onProjectPublished", () => {
  it("creates in-app notifications for all active investors", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "inv-user-1" }, { id: "inv-user-2" }]).mockResolvedValueOnce(investorEmails);
    await notificationService.onProjectPublished("Poultry Farm", "poultry-farm", "proj-1", "A great farm project");
    expect(mockCreateMany).toHaveBeenCalledOnce();
    const call = mockCreateMany.mock.calls[0][0];
    expect(call.data).toHaveLength(2);
    expect(call.data[0].type).toBe("PROJECT_APPROVED");
    expect(call.data[0].title).toContain("Poultry Farm");
  });

  it("sends email to all active investors", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "inv-user-1" }, { id: "inv-user-2" }]).mockResolvedValueOnce(investorEmails);
    await notificationService.onProjectPublished("Poultry Farm", "poultry-farm", "proj-1", "A great farm project");
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail.mock.calls[0][0].subject).toContain("Poultry Farm");
  });

  it("truncates long descriptions to 200 chars in email", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "inv-user-1" }]).mockResolvedValueOnce([{ email: "investor@test.com" }]);
    const longDesc = "A".repeat(300);
    await notificationService.onProjectPublished("Farm", "farm", "proj-1", longDesc);
    const html = mockSendEmail.mock.calls[0][0].html as string;
    expect(html).toContain("…");
  });
});

// ─── onWithdrawalStatusChanged ────────────────────────────────────────────────

describe("notificationService.onWithdrawalStatusChanged", () => {
  it("creates WITHDRAWAL_APPROVED notification when approved", async () => {
    await notificationService.onWithdrawalStatusChanged("user-1", "Arif", "arif@test.com", "APPROVED", 10000, "wd-1");
    const call = mockCreate.mock.calls[0][0];
    expect(call.data.type).toBe("WITHDRAWAL_APPROVED");
    expect(call.data.title).toBe("Withdrawal Approved");
  });

  it("creates SYSTEM notification when rejected", async () => {
    await notificationService.onWithdrawalStatusChanged("user-1", "Arif", "arif@test.com", "REJECTED", 10000, "wd-1", "Insufficient docs");
    const call = mockCreate.mock.calls[0][0];
    expect(call.data.type).toBe("SYSTEM");
    expect(call.data.title).toBe("Withdrawal Rejected");
    expect(call.data.body).toContain("Insufficient docs");
  });

  it("sends email with correct status", async () => {
    await notificationService.onWithdrawalStatusChanged("user-1", "Arif", "arif@test.com", "APPROVED", 10000, "wd-1");
    expect(mockSendEmail).toHaveBeenCalledOnce();
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("arif@test.com");
    expect(call.subject).toContain("approved");
  });
});

// ─── onKycStatusChanged ───────────────────────────────────────────────────────

describe("notificationService.onKycStatusChanged", () => {
  it("creates KYC_APPROVED notification when verified", async () => {
    await notificationService.onKycStatusChanged("user-1", "Arif", "arif@test.com", "VERIFIED");
    const call = mockCreate.mock.calls[0][0];
    expect(call.data.type).toBe("KYC_APPROVED");
    expect(call.data.title).toBe("KYC Verified");
  });

  it("creates KYC_REJECTED notification when rejected", async () => {
    await notificationService.onKycStatusChanged("user-1", "Arif", "arif@test.com", "REJECTED", "ID unclear");
    const call = mockCreate.mock.calls[0][0];
    expect(call.data.type).toBe("KYC_REJECTED");
    expect(call.data.title).toBe("KYC Rejected");
    expect(call.data.body).toContain("ID unclear");
  });

  it("sends KYC email to investor", async () => {
    await notificationService.onKycStatusChanged("user-1", "Arif", "arif@test.com", "VERIFIED");
    expect(mockSendEmail).toHaveBeenCalledOnce();
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("arif@test.com");
    expect(call.subject).toContain("verified");
  });
});

// ─── onDistributionPosted ─────────────────────────────────────────────────────

describe("notificationService.onDistributionPosted", () => {
  const lines = [
    { investorUserId: "user-1", investorEmail: "a@test.com", investorName: "Arif", netAmountBdt: 5000, projectTitle: "Poultry Farm", batchId: "batch-1" },
    { investorUserId: "user-2", investorEmail: "b@test.com", investorName: "Rahim", netAmountBdt: 3000, projectTitle: "Poultry Farm", batchId: "batch-1" },
  ];

  it("creates in-app notification for each investor", async () => {
    await notificationService.onDistributionPosted(lines);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].data.type).toBe("DISTRIBUTION_POSTED");
    expect(mockCreate.mock.calls[0][0].data.userId).toBe("user-1");
    expect(mockCreate.mock.calls[1][0].data.userId).toBe("user-2");
  });

  it("sends email to each investor", async () => {
    await notificationService.onDistributionPosted(lines);
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail.mock.calls[0][0].to).toBe("a@test.com");
    expect(mockSendEmail.mock.calls[1][0].to).toBe("b@test.com");
  });

  it("handles empty lines array without throwing", async () => {
    await expect(notificationService.onDistributionPosted([])).resolves.not.toThrow();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
