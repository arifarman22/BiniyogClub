import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/prisma";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

const mockFindMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  db: {
    rolePermission: {
      findMany: mockFindMany,
    },
  },
}));

// Import after mock
const { can, requirePermission, requireOwnerOrPermission, canAccessResource, canStatic, isStaff, isPlatformAdmin, isSuperAdmin } =
  await import("@/lib/authz/index");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSession(role: UserRole, id = "user-1"): SessionUser {
  return {
    id,
    email: "test@example.com",
    name: "Test",
    phone: null,
    role,
    status: "ACTIVE",
    emailVerified: true,
  };
}

function mockPermissions(keys: string[]) {
  mockFindMany.mockResolvedValue(keys.map((key) => ({ permission: { key } })));
}

// ─── can() ────────────────────────────────────────────────────────────────────

describe("can()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true for SUPER_ADMIN without DB query", async () => {
    const session = makeSession("SUPER_ADMIN");
    const result = await can(session, "project.approve");
    expect(result).toBe(true);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns true when permission is in DB result", async () => {
    const session = makeSession("PROJECT_MANAGER");
    mockPermissions(["project.approve", "project.publish"]);
    expect(await can(session, "project.approve")).toBe(true);
  });

  it("returns false when permission is not in DB result", async () => {
    const session = makeSession("INVESTOR");
    mockPermissions(["investment.create", "investment.cancel"]);
    expect(await can(session, "project.approve")).toBe(false);
  });

  it("caches permissions — only one DB query per session object", async () => {
    const session = makeSession("FINANCE_OFFICER");
    mockPermissions(["payment.view", "payment.verify"]);

    await can(session, "payment.view");
    await can(session, "payment.verify");
    await can(session, "withdrawal.approve");

    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("different session objects each trigger a DB query", async () => {
    mockPermissions(["payment.view"]);
    const s1 = makeSession("FINANCE_OFFICER", "user-1");
    const s2 = makeSession("FINANCE_OFFICER", "user-2");

    await can(s1, "payment.view");
    await can(s2, "payment.view");

    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });
});

// ─── requirePermission() ──────────────────────────────────────────────────────

describe("requirePermission()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not throw when permission is granted", async () => {
    const session = makeSession("KYC_OFFICER");
    mockPermissions(["kyc.approve"]);
    await expect(requirePermission(session, "kyc.approve")).resolves.not.toThrow();
  });

  it("throws ForbiddenError when permission is denied", async () => {
    const session = makeSession("INVESTOR");
    mockPermissions(["investment.create"]);
    await expect(requirePermission(session, "kyc.approve")).rejects.toThrow(ForbiddenError);
  });

  it("ForbiddenError message includes the permission key", async () => {
    const session = makeSession("FARMER");
    mockPermissions([]);
    try {
      await requirePermission(session, "audit.view");
    } catch (e) {
      expect((e as ForbiddenError).message).toContain("audit.view");
    }
  });

  it("SUPER_ADMIN never throws", async () => {
    const session = makeSession("SUPER_ADMIN");
    await expect(requirePermission(session, "audit.view")).resolves.not.toThrow();
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

// ─── requireOwnerOrPermission() ───────────────────────────────────────────────

describe("requireOwnerOrPermission()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes when user is the owner", async () => {
    const session = makeSession("INVESTOR", "owner-id");
    await expect(
      requireOwnerOrPermission(session, "owner-id", "investment.view"),
    ).resolves.not.toThrow();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("passes when user has override permission", async () => {
    const session = makeSession("ADMIN", "admin-id");
    mockPermissions(["investment.view"]);
    await expect(
      requireOwnerOrPermission(session, "other-user-id", "investment.view"),
    ).resolves.not.toThrow();
  });

  it("throws ForbiddenError when not owner and lacks permission", async () => {
    const session = makeSession("INVESTOR", "user-1");
    mockPermissions(["investment.create"]);
    await expect(
      requireOwnerOrPermission(session, "user-2", "investment.view"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("prevents IDOR — investor cannot access another investor's resource", async () => {
    const session = makeSession("INVESTOR", "investor-a");
    mockPermissions(["investment.create", "investment.cancel"]);
    await expect(
      requireOwnerOrPermission(session, "investor-b", "investment.view"),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ─── canAccessResource() ──────────────────────────────────────────────────────

describe("canAccessResource()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true for owner", async () => {
    const session = makeSession("FARMER", "farmer-1");
    expect(await canAccessResource(session, "farmer-1", "farm.view")).toBe(true);
  });

  it("returns true for non-owner with permission", async () => {
    const session = makeSession("FIELD_OFFICER", "officer-1");
    mockPermissions(["farm.view"]);
    expect(await canAccessResource(session, "farmer-1", "farm.view")).toBe(true);
  });

  it("returns false for non-owner without permission", async () => {
    const session = makeSession("INVESTOR", "investor-1");
    mockPermissions(["investment.create"]);
    expect(await canAccessResource(session, "farmer-1", "farm.view")).toBe(false);
  });
});

// ─── canStatic() ─────────────────────────────────────────────────────────────

describe("canStatic()", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns true for SUPER_ADMIN on any permission", () => {
    expect(canStatic("SUPER_ADMIN", "audit.view")).toBe(true);
    expect(canStatic("SUPER_ADMIN", "user.delete")).toBe(true);
  });

  it("returns true for role with permission in matrix", () => {
    expect(canStatic("FINANCE_OFFICER", "payment.verify")).toBe(true);
    expect(canStatic("KYC_OFFICER", "kyc.approve")).toBe(true);
  });

  it("returns false for role without permission in matrix", () => {
    expect(canStatic("INVESTOR", "project.approve")).toBe(false);
    expect(canStatic("FARMER", "audit.view")).toBe(false);
    expect(canStatic("SUPPORT", "user.delete")).toBe(false);
  });

  it("does not hit the database", () => {
    canStatic("ADMIN", "user.view");
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

// ─── Role helpers ─────────────────────────────────────────────────────────────

describe("isStaff()", () => {
  it("returns true for all staff roles", () => {
    const staffRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "FIELD_OFFICER", "SUPPORT"];
    for (const role of staffRoles) {
      expect(isStaff(role), `${role} should be staff`).toBe(true);
    }
  });

  it("returns false for INVESTOR and FARMER", () => {
    expect(isStaff("INVESTOR")).toBe(false);
    expect(isStaff("FARMER")).toBe(false);
  });
});

describe("isPlatformAdmin()", () => {
  it("returns true for SUPER_ADMIN and ADMIN", () => {
    expect(isPlatformAdmin("SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdmin("ADMIN")).toBe(true);
  });

  it("returns false for all other roles", () => {
    const others: UserRole[] = ["FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "FIELD_OFFICER", "SUPPORT", "INVESTOR", "FARMER"];
    for (const role of others) {
      expect(isPlatformAdmin(role)).toBe(false);
    }
  });
});

describe("isSuperAdmin()", () => {
  it("returns true only for SUPER_ADMIN", () => {
    expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(isSuperAdmin("ADMIN")).toBe(false);
    expect(isSuperAdmin("INVESTOR")).toBe(false);
  });
});
