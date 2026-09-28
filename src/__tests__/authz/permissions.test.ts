import { describe, it, expect } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/authz/permissions";
import type { UserRole } from "@/types/prisma";

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];
const ALL_ROLES = Object.keys(ROLE_PERMISSIONS) as UserRole[];

describe("ROLE_PERMISSIONS matrix", () => {
  it("defines permissions for all 9 roles", () => {
    const expectedRoles: UserRole[] = [
      "SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER",
      "KYC_OFFICER", "FIELD_OFFICER", "SUPPORT", "INVESTOR", "FARMER",
    ];
    expect(ALL_ROLES.sort()).toEqual(expectedRoles.sort());
  });

  it("SUPER_ADMIN has every permission", () => {
    const superAdminPerms = ROLE_PERMISSIONS.SUPER_ADMIN;
    for (const perm of ALL_PERMISSIONS) {
      expect(superAdminPerms).toContain(perm);
    }
  });

  it("INVESTOR cannot approve projects", () => {
    expect(ROLE_PERMISSIONS.INVESTOR).not.toContain("project.approve");
  });

  it("INVESTOR can view their own investments", () => {
    // investment.view allows investors to see their own investments (ownership-scoped)
    expect(ROLE_PERMISSIONS.INVESTOR).toContain("investment.view");
  });

  it("INVESTOR can create investments", () => {
    expect(ROLE_PERMISSIONS.INVESTOR).toContain("investment.create");
  });

  it("FARMER can create projects", () => {
    expect(ROLE_PERMISSIONS.FARMER).toContain("project.create");
  });

  it("FARMER cannot approve projects", () => {
    expect(ROLE_PERMISSIONS.FARMER).not.toContain("project.approve");
  });

  it("FARMER cannot view all investments", () => {
    expect(ROLE_PERMISSIONS.FARMER).not.toContain("investment.view");
  });

  it("KYC_OFFICER can review and approve KYC", () => {
    expect(ROLE_PERMISSIONS.KYC_OFFICER).toContain("kyc.review");
    expect(ROLE_PERMISSIONS.KYC_OFFICER).toContain("kyc.approve");
  });

  it("KYC_OFFICER cannot approve withdrawals", () => {
    expect(ROLE_PERMISSIONS.KYC_OFFICER).not.toContain("withdrawal.approve");
  });

  it("FINANCE_OFFICER can verify payments and approve withdrawals", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain("payment.verify");
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain("withdrawal.approve");
  });

  it("FINANCE_OFFICER cannot approve projects", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).not.toContain("project.approve");
  });

  it("PROJECT_MANAGER can approve and publish projects", () => {
    expect(ROLE_PERMISSIONS.PROJECT_MANAGER).toContain("project.approve");
    expect(ROLE_PERMISSIONS.PROJECT_MANAGER).toContain("project.publish");
  });

  it("PROJECT_MANAGER cannot approve withdrawals", () => {
    expect(ROLE_PERMISSIONS.PROJECT_MANAGER).not.toContain("withdrawal.approve");
  });

  it("FIELD_OFFICER can conduct field visits", () => {
    expect(ROLE_PERMISSIONS.FIELD_OFFICER).toContain("field_visit.conduct");
  });

  it("FIELD_OFFICER cannot change user roles", () => {
    expect(ROLE_PERMISSIONS.FIELD_OFFICER).not.toContain("user.change_role");
  });

  it("SUPPORT has read-only access to most resources", () => {
    expect(ROLE_PERMISSIONS.SUPPORT).toContain("user.view");
    expect(ROLE_PERMISSIONS.SUPPORT).toContain("project.view");
    expect(ROLE_PERMISSIONS.SUPPORT).not.toContain("user.delete");
    expect(ROLE_PERMISSIONS.SUPPORT).not.toContain("project.approve");
  });

  it("no role has duplicate permissions", () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      const unique = new Set(perms);
      expect(unique.size, `${role} has duplicate permissions`).toBe(perms.length);
    }
  });

  it("all permission values are valid keys", () => {
    const validKeys = new Set(ALL_PERMISSIONS);
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      for (const perm of perms) {
        expect(validKeys.has(perm), `${role} has unknown permission: ${perm}`).toBe(true);
      }
    }
  });
});
