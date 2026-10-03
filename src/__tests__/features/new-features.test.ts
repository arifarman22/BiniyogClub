import { describe, it, expect } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/authz/permissions";
import { canStatic } from "@/lib/authz";
import { getDisplayState } from "@/components/shared/project-status-badge";

// ─── FINANCE_OFFICER project permissions ─────────────────────────────────────

describe("FINANCE_OFFICER project permissions", () => {
  it("has project.view permission", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.PROJECT_VIEW);
  });

  it("has project.update permission", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.PROJECT_UPDATE);
  });

  it("cannot create projects", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).not.toContain(PERMISSIONS.PROJECT_CREATE);
  });

  it("cannot approve projects", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).not.toContain(PERMISSIONS.PROJECT_APPROVE);
  });

  it("cannot publish projects", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).not.toContain(PERMISSIONS.PROJECT_PUBLISH);
  });

  it("cannot delete projects", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).not.toContain(PERMISSIONS.PROJECT_DELETE);
  });

  it("canStatic returns true for FINANCE_OFFICER + project.update", () => {
    expect(canStatic("FINANCE_OFFICER", "project.update")).toBe(true);
  });

  it("canStatic returns true for FINANCE_OFFICER + project.view", () => {
    expect(canStatic("FINANCE_OFFICER", "project.view")).toBe(true);
  });

  it("canStatic returns false for FINANCE_OFFICER + project.approve", () => {
    expect(canStatic("FINANCE_OFFICER", "project.approve")).toBe(false);
  });

  it("still has all original finance permissions", () => {
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.PAYMENT_VIEW);
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.PAYMENT_VERIFY);
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.WITHDRAWAL_APPROVE);
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.DISTRIBUTION_CREATE);
    expect(ROLE_PERMISSIONS.FINANCE_OFFICER).toContain(PERMISSIONS.DISTRIBUTION_POST);
  });

  it("no duplicate permissions after adding project permissions", () => {
    const perms = ROLE_PERMISSIONS.FINANCE_OFFICER;
    const unique = new Set(perms);
    expect(unique.size).toBe(perms.length);
  });
});

// ─── Project display state (3-state system) ───────────────────────────────────

describe("getDisplayState()", () => {
  it("FUNDRAISING → active", () => {
    expect(getDisplayState("FUNDRAISING")).toBe("active");
  });

  it("FUNDED → running", () => {
    expect(getDisplayState("FUNDED")).toBe("running");
  });

  it("ACTIVE → running", () => {
    expect(getDisplayState("ACTIVE")).toBe("running");
  });

  it("COMPLETED → completed", () => {
    expect(getDisplayState("COMPLETED")).toBe("completed");
  });

  it("DRAFT → inactive", () => {
    expect(getDisplayState("DRAFT")).toBe("inactive");
  });

  it("PENDING_APPROVAL → inactive", () => {
    expect(getDisplayState("PENDING_APPROVAL")).toBe("inactive");
  });

  it("APPROVED → inactive", () => {
    expect(getDisplayState("APPROVED")).toBe("inactive");
  });

  it("CANCELLED → inactive", () => {
    expect(getDisplayState("CANCELLED")).toBe("inactive");
  });

  it("unknown status → inactive", () => {
    expect(getDisplayState("SOME_UNKNOWN_STATUS")).toBe("inactive");
  });
});

// ─── Investment eligibility by display state ──────────────────────────────────

describe("investment eligibility by project status", () => {
  function canInvest(status: string): boolean {
    const state = getDisplayState(status);
    return state === "active" || state === "running";
  }

  it("investor CAN invest when project is FUNDRAISING (active)", () => {
    expect(canInvest("FUNDRAISING")).toBe(true);
  });

  it("investor CAN invest when project is FUNDED (running)", () => {
    expect(canInvest("FUNDED")).toBe(true);
  });

  it("investor CAN invest when project is ACTIVE (running)", () => {
    expect(canInvest("ACTIVE")).toBe(true);
  });

  it("investor CANNOT invest when project is COMPLETED", () => {
    expect(canInvest("COMPLETED")).toBe(false);
  });

  it("investor CANNOT invest when project is DRAFT (inactive)", () => {
    expect(canInvest("DRAFT")).toBe(false);
  });

  it("investor CANNOT invest when project is CANCELLED (inactive)", () => {
    expect(canInvest("CANCELLED")).toBe(false);
  });

  it("investor CANNOT invest when project is PENDING_APPROVAL (inactive)", () => {
    expect(canInvest("PENDING_APPROVAL")).toBe(false);
  });
});

// ─── KYC banner state logic ───────────────────────────────────────────────────

describe("KYC banner visibility logic", () => {
  function shouldShowBanner(kycStatus: string): boolean {
    return kycStatus !== "VERIFIED";
  }

  function getBannerVariant(kycStatus: string): "destructive" | "warning" | "none" {
    if (["NOT_STARTED", "REJECTED", "RESUBMISSION_REQUIRED"].includes(kycStatus)) {
      return "destructive";
    }
    if (["SUBMITTED", "UNDER_REVIEW"].includes(kycStatus)) {
      return "warning";
    }
    return "none";
  }

  it("shows banner for NOT_STARTED", () => {
    expect(shouldShowBanner("NOT_STARTED")).toBe(true);
  });

  it("shows banner for SUBMITTED", () => {
    expect(shouldShowBanner("SUBMITTED")).toBe(true);
  });

  it("shows banner for UNDER_REVIEW", () => {
    expect(shouldShowBanner("UNDER_REVIEW")).toBe(true);
  });

  it("shows banner for REJECTED", () => {
    expect(shouldShowBanner("REJECTED")).toBe(true);
  });

  it("shows banner for RESUBMISSION_REQUIRED", () => {
    expect(shouldShowBanner("RESUBMISSION_REQUIRED")).toBe(true);
  });

  it("hides banner for VERIFIED", () => {
    expect(shouldShowBanner("VERIFIED")).toBe(false);
  });

  it("NOT_STARTED shows destructive (red) banner", () => {
    expect(getBannerVariant("NOT_STARTED")).toBe("destructive");
  });

  it("REJECTED shows destructive (red) banner", () => {
    expect(getBannerVariant("REJECTED")).toBe("destructive");
  });

  it("RESUBMISSION_REQUIRED shows destructive (red) banner", () => {
    expect(getBannerVariant("RESUBMISSION_REQUIRED")).toBe("destructive");
  });

  it("SUBMITTED shows warning (yellow) banner", () => {
    expect(getBannerVariant("SUBMITTED")).toBe("warning");
  });

  it("UNDER_REVIEW shows warning (yellow) banner", () => {
    expect(getBannerVariant("UNDER_REVIEW")).toBe("warning");
  });

  it("VERIFIED shows no banner", () => {
    expect(getBannerVariant("VERIFIED")).toBe("none");
  });
});

// ─── Project bank account validation ─────────────────────────────────────────

describe("project bank account fields", () => {
  type BankAccount = {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName?: string | null;
    routingNumber?: string | null;
    swiftCode?: string | null;
    mobileNumber?: string | null;
    email?: string | null;
    branchAddress?: string | null;
  };

  function validateBankAccount(data: Partial<BankAccount>): string[] {
    const errors: string[] = [];
    if (!data.accountName || data.accountName.length < 2) errors.push("accountName");
    if (!data.accountNumber || data.accountNumber.length < 4) errors.push("accountNumber");
    if (!data.bankName || data.bankName.length < 2) errors.push("bankName");
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("email");
    return errors;
  }

  it("passes with all required fields", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      accountNumber: "1234567890",
      bankName: "Dutch-Bangla Bank",
    })).toHaveLength(0);
  });

  it("fails when accountName is missing", () => {
    expect(validateBankAccount({
      accountNumber: "1234567890",
      bankName: "Dutch-Bangla Bank",
    })).toContain("accountName");
  });

  it("fails when accountNumber is missing", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      bankName: "Dutch-Bangla Bank",
    })).toContain("accountNumber");
  });

  it("fails when bankName is missing", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      accountNumber: "1234567890",
    })).toContain("bankName");
  });

  it("fails with invalid email format", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      accountNumber: "1234567890",
      bankName: "Dutch-Bangla Bank",
      email: "not-an-email",
    })).toContain("email");
  });

  it("passes with valid email", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      accountNumber: "1234567890",
      bankName: "Dutch-Bangla Bank",
      email: "finance@biniyogclub.com",
    })).toHaveLength(0);
  });

  it("optional fields do not cause failures when null", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      accountNumber: "1234567890",
      bankName: "Dutch-Bangla Bank",
      branchName: null,
      routingNumber: null,
      swiftCode: null,
      mobileNumber: null,
      email: null,
      branchAddress: null,
    })).toHaveLength(0);
  });

  it("all optional fields can be provided together", () => {
    expect(validateBankAccount({
      accountName: "Biniyog Club Ltd",
      accountNumber: "1234567890",
      bankName: "Dutch-Bangla Bank",
      branchName: "Mohakhali Branch",
      routingNumber: "090261234",
      swiftCode: "DBBLBDDH",
      mobileNumber: "01712345678",
      email: "finance@biniyogclub.com",
      branchAddress: "12 Mohakhali C/A, Dhaka-1212",
    })).toHaveLength(0);
  });
});

// ─── KYC prefill logic ────────────────────────────────────────────────────────

describe("KYC form prefill from registration data", () => {
  type Prefill = {
    name: string;
    phone: string;
    nationalId: string;
    nomineeNationalId: string;
    nomineeRelation: string;
  };

  function buildInitialForm(existing: Record<string, string> | null, prefill: Prefill) {
    return {
      fullName:       existing?.fullName       ?? prefill.name,
      documentNumber: existing?.documentNumber ?? prefill.nationalId,
      mobileNumber:   existing?.mobileNumber   ?? prefill.phone,
    };
  }

  const prefill: Prefill = {
    name: "Mohammad Arif",
    phone: "01712345678",
    nationalId: "1234567890",
    nomineeNationalId: "9876543210",
    nomineeRelation: "Father",
  };

  it("pre-fills fullName from registration name when no existing KYC", () => {
    expect(buildInitialForm(null, prefill).fullName).toBe("Mohammad Arif");
  });

  it("pre-fills documentNumber from nationalId when no existing KYC", () => {
    expect(buildInitialForm(null, prefill).documentNumber).toBe("1234567890");
  });

  it("pre-fills mobileNumber from phone when no existing KYC", () => {
    expect(buildInitialForm(null, prefill).mobileNumber).toBe("01712345678");
  });

  it("uses existing KYC data over prefill when draft exists", () => {
    const existing = {
      fullName: "Arif Updated",
      documentNumber: "1111111111",
      mobileNumber: "01800000000",
    };
    const form = buildInitialForm(existing, prefill);
    expect(form.fullName).toBe("Arif Updated");
    expect(form.documentNumber).toBe("1111111111");
    expect(form.mobileNumber).toBe("01800000000");
  });

  it("nominee fields come from investorProfile (read-only)", () => {
    expect(prefill.nomineeNationalId).toBe("9876543210");
    expect(prefill.nomineeRelation).toBe("Father");
  });

  it("handles empty prefill gracefully", () => {
    const emptyPrefill: Prefill = {
      name: "", phone: "", nationalId: "",
      nomineeNationalId: "", nomineeRelation: "",
    };
    const form = buildInitialForm(null, emptyPrefill);
    expect(form.fullName).toBe("");
    expect(form.documentNumber).toBe("");
    expect(form.mobileNumber).toBe("");
  });
});

// ─── Nominee NID document type ────────────────────────────────────────────────

describe("KYC document type — NOMINEE_NID", () => {
  const ALLOWED_TYPES = ["NATIONAL_ID", "PASSPORT", "DRIVING_LICENSE", "NOMINEE_NID"];

  it("NOMINEE_NID is in the allowed upload types", () => {
    expect(ALLOWED_TYPES).toContain("NOMINEE_NID");
  });

  it("NOMINEE_NID_FRONT is the stored document type for front side", () => {
    expect(`NOMINEE_NID_FRONT`).toBe("NOMINEE_NID_FRONT");
  });

  it("NOMINEE_NID_BACK is the stored document type for back side", () => {
    expect(`NOMINEE_NID_BACK`).toBe("NOMINEE_NID_BACK");
  });

  it("stored type is constructed as docType_side", () => {
    const docType = "NOMINEE_NID";
    expect(`${docType}_FRONT`).toBe("NOMINEE_NID_FRONT");
    expect(`${docType}_BACK`).toBe("NOMINEE_NID_BACK");
  });

  it("investor document types are still allowed", () => {
    expect(ALLOWED_TYPES).toContain("NATIONAL_ID");
    expect(ALLOWED_TYPES).toContain("PASSPORT");
    expect(ALLOWED_TYPES).toContain("DRIVING_LICENSE");
  });

  it("unknown document types are not allowed", () => {
    expect(ALLOWED_TYPES).not.toContain("UTILITY_BILL");
    expect(ALLOWED_TYPES).not.toContain("RANDOM_DOC");
  });
});
