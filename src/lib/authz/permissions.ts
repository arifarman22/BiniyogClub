import type { UserRole } from "@/types/prisma";

// ─── Permission Keys ──────────────────────────────────────────────────────────
// Format: <resource>.<action>
// Wildcard: <resource>.* grants all actions on that resource (SUPER_ADMIN only)

export const PERMISSIONS = {
  // ── User management ──────────────────────────────────────────────────────
  USER_VIEW:          "user.view",
  USER_CREATE:        "user.create",
  USER_UPDATE:        "user.update",
  USER_DELETE:        "user.delete",
  USER_SUSPEND:       "user.suspend",
  USER_CHANGE_ROLE:   "user.change_role",

  // ── Project management ───────────────────────────────────────────────────
  PROJECT_VIEW:       "project.view",
  PROJECT_CREATE:     "project.create",
  PROJECT_UPDATE:     "project.update",
  PROJECT_DELETE:     "project.delete",
  PROJECT_SUBMIT:     "project.submit",
  PROJECT_APPROVE:    "project.approve",
  PROJECT_PUBLISH:    "project.publish",
  PROJECT_ARCHIVE:    "project.archive",

  // ── Investment management ────────────────────────────────────────────────
  INVESTMENT_VIEW:    "investment.view",
  INVESTMENT_CREATE:  "investment.create",
  INVESTMENT_APPROVE: "investment.approve",
  INVESTMENT_CANCEL:  "investment.cancel",

  // ── Payment management ───────────────────────────────────────────────────
  PAYMENT_VIEW:       "payment.view",
  PAYMENT_VERIFY:     "payment.verify",

  // ── Withdrawal management ────────────────────────────────────────────────
  WITHDRAWAL_VIEW:    "withdrawal.view",
  WITHDRAWAL_REQUEST: "withdrawal.request",
  WITHDRAWAL_APPROVE: "withdrawal.approve",

  // ── KYC management ───────────────────────────────────────────────────────
  KYC_VIEW:           "kyc.view",
  KYC_SUBMIT:         "kyc.submit",
  KYC_REVIEW:         "kyc.review",
  KYC_APPROVE:        "kyc.approve",

  // ── Farmer management ────────────────────────────────────────────────────
  FARMER_VIEW:        "farmer.view",
  FARMER_CREATE:      "farmer.create",
  FARMER_UPDATE:      "farmer.update",

  // ── Farm management ──────────────────────────────────────────────────────
  FARM_VIEW:          "farm.view",
  FARM_CREATE:        "farm.create",
  FARM_UPDATE:        "farm.update",

  // ── Field visit management ───────────────────────────────────────────────
  FIELD_VISIT_VIEW:     "field_visit.view",
  FIELD_VISIT_SCHEDULE: "field_visit.schedule",
  FIELD_VISIT_CONDUCT:  "field_visit.conduct",

  // ── Reports ──────────────────────────────────────────────────────────────
  REPORT_VIEW:        "report.view",

  // ── Audit ────────────────────────────────────────────────────────────────
  AUDIT_VIEW:         "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Permission descriptions ──────────────────────────────────────────────────

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "user.view":           "View user profiles and lists",
  "user.create":         "Create new user accounts",
  "user.update":         "Update user profile information",
  "user.delete":         "Soft-delete user accounts",
  "user.suspend":        "Suspend or reactivate user accounts",
  "user.change_role":    "Change a user's role",
  "project.view":        "View all projects including drafts",
  "project.create":      "Create new farm projects",
  "project.update":      "Update project details",
  "project.delete":      "Delete or archive projects",
  "project.submit":      "Submit a project for review",
  "project.approve":     "Approve or reject submitted projects",
  "project.publish":     "Publish approved projects to investors",
  "project.archive":     "Archive completed or cancelled projects",
  "investment.view":     "View all investments",
  "investment.create":   "Make a new investment",
  "investment.approve":  "Approve or confirm investments",
  "investment.cancel":   "Cancel an investment",
  "payment.view":        "View payment records",
  "payment.verify":      "Verify and reconcile payments",
  "withdrawal.view":     "View withdrawal requests",
  "withdrawal.request":  "Request a wallet withdrawal",
  "withdrawal.approve":  "Approve or reject withdrawal requests",
  "kyc.view":            "View KYC submissions",
  "kyc.submit":          "Submit own KYC documents",
  "kyc.review":          "Review KYC submissions",
  "kyc.approve":         "Approve or reject KYC submissions",
  "farmer.view":         "View farmer profiles",
  "farmer.create":       "Register as a farmer",
  "farmer.update":       "Update farmer profile",
  "farm.view":           "View farm details",
  "farm.create":         "Register a new farm",
  "farm.update":         "Update farm information",
  "field_visit.view":    "View field visit reports",
  "field_visit.schedule":"Schedule a field visit",
  "field_visit.conduct": "Conduct and submit field visit reports",
  "report.view":         "Access platform reports and analytics",
  "audit.view":          "View audit logs",
};

// ─── Role → Permission matrix ─────────────────────────────────────────────────
// This is the authoritative definition. The DB is seeded from this.

const P = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS) as Permission[],

  ADMIN: [
    P.USER_VIEW, P.USER_CREATE, P.USER_UPDATE, P.USER_DELETE, P.USER_SUSPEND, P.USER_CHANGE_ROLE,
    P.PROJECT_VIEW, P.PROJECT_UPDATE, P.PROJECT_APPROVE, P.PROJECT_PUBLISH, P.PROJECT_ARCHIVE,
    P.INVESTMENT_VIEW, P.INVESTMENT_APPROVE, P.INVESTMENT_CANCEL,
    P.PAYMENT_VIEW, P.PAYMENT_VERIFY,
    P.WITHDRAWAL_VIEW, P.WITHDRAWAL_APPROVE,
    P.KYC_VIEW, P.KYC_REVIEW, P.KYC_APPROVE,
    P.FARMER_VIEW, P.FARMER_UPDATE,
    P.FARM_VIEW, P.FARM_UPDATE,
    P.FIELD_VISIT_VIEW, P.FIELD_VISIT_SCHEDULE,
    P.REPORT_VIEW,
    P.AUDIT_VIEW,
  ],

  FINANCE_OFFICER: [
    P.PAYMENT_VIEW, P.PAYMENT_VERIFY,
    P.WITHDRAWAL_VIEW, P.WITHDRAWAL_APPROVE,
    P.INVESTMENT_VIEW,
    P.REPORT_VIEW,
    P.USER_VIEW,
  ],

  PROJECT_MANAGER: [
    P.PROJECT_VIEW, P.PROJECT_UPDATE, P.PROJECT_APPROVE, P.PROJECT_PUBLISH, P.PROJECT_ARCHIVE,
    P.FARM_VIEW,
    P.FARMER_VIEW,
    P.FIELD_VISIT_VIEW, P.FIELD_VISIT_SCHEDULE,
    P.INVESTMENT_VIEW,
    P.REPORT_VIEW,
    P.USER_VIEW,
  ],

  KYC_OFFICER: [
    P.KYC_VIEW, P.KYC_REVIEW, P.KYC_APPROVE,
    P.USER_VIEW,
    P.FARMER_VIEW,
  ],

  FIELD_OFFICER: [
    P.FIELD_VISIT_VIEW, P.FIELD_VISIT_SCHEDULE, P.FIELD_VISIT_CONDUCT,
    P.FARM_VIEW,
    P.PROJECT_VIEW,
    P.FARMER_VIEW,
  ],

  SUPPORT: [
    P.USER_VIEW,
    P.PROJECT_VIEW,
    P.INVESTMENT_VIEW,
    P.KYC_VIEW,
    P.PAYMENT_VIEW,
    P.WITHDRAWAL_VIEW,
    P.FARM_VIEW,
    P.FARMER_VIEW,
  ],

  INVESTOR: [
    P.INVESTMENT_VIEW, P.INVESTMENT_CREATE, P.INVESTMENT_CANCEL,
    P.PROJECT_VIEW,
    P.KYC_SUBMIT,
    P.WITHDRAWAL_REQUEST,
  ],

  FARMER: [
    P.PROJECT_VIEW, P.PROJECT_CREATE, P.PROJECT_UPDATE, P.PROJECT_DELETE, P.PROJECT_SUBMIT,
    P.FARM_VIEW, P.FARM_CREATE, P.FARM_UPDATE,
    P.FARMER_VIEW, P.FARMER_CREATE, P.FARMER_UPDATE,
    P.KYC_SUBMIT,
    P.WITHDRAWAL_REQUEST,
    P.FIELD_VISIT_VIEW,
  ],
};
