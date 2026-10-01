import type { UserRole } from "@/types/prisma";

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

  // ── Distribution management ──────────────────────────────────────────────
  DISTRIBUTION_VIEW:    "distribution.view",
  DISTRIBUTION_CREATE:  "distribution.create",
  DISTRIBUTION_APPROVE: "distribution.approve",
  DISTRIBUTION_POST:    "distribution.post",
  DISTRIBUTION_VOID:    "distribution.void",

  // ── Reports ──────────────────────────────────────────────────────────────
  REPORT_VIEW:        "report.view",

  // ── Audit ────────────────────────────────────────────────────────────────
  AUDIT_VIEW:         "audit.view",

  // ── Documents ────────────────────────────────────────────────────────────
  DOCUMENT_VIEW:      "document.view",
  DOCUMENT_UPLOAD:    "document.upload",
  DOCUMENT_DOWNLOAD:  "document.download",
  DOCUMENT_DELETE:    "document.delete",
  DOCUMENT_MANAGE:    "document.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "user.view":          "View user profiles and lists",
  "user.create":        "Create new user accounts",
  "user.update":        "Update user profile information",
  "user.delete":        "Soft-delete user accounts",
  "user.suspend":       "Suspend or reactivate user accounts",
  "user.change_role":   "Change a user's role",
  "project.view":       "View all projects including drafts",
  "project.create":     "Create new projects",
  "project.update":     "Update project details",
  "project.delete":     "Delete or archive projects",
  "project.approve":    "Approve or reject submitted projects",
  "project.publish":    "Publish approved projects to investors",
  "project.archive":    "Archive completed or cancelled projects",
  "investment.view":    "View all investments",
  "investment.create":  "Make a new investment",
  "investment.approve": "Approve or confirm investments",
  "investment.cancel":  "Cancel an investment",
  "payment.view":       "View payment records",
  "payment.verify":     "Verify and reconcile payments",
  "withdrawal.view":    "View withdrawal requests",
  "withdrawal.request": "Request a wallet withdrawal",
  "withdrawal.approve": "Approve or reject withdrawal requests",
  "kyc.view":           "View KYC submissions",
  "kyc.submit":         "Submit own KYC documents",
  "kyc.review":         "Review KYC submissions",
  "kyc.approve":        "Approve or reject KYC submissions",
  "distribution.view":    "View distribution batches and line items",
  "distribution.create":  "Create and calculate distribution batches",
  "distribution.approve": "Approve distribution batches for posting",
  "distribution.post":    "Post approved distributions to investor ledgers",
  "distribution.void":    "Void a posted distribution batch",
  "report.view":          "Access platform reports and analytics",
  "audit.view":           "View audit logs",
  "document.view":        "View document metadata",
  "document.upload":      "Upload documents",
  "document.download":    "Download documents via signed URL",
  "document.delete":      "Delete documents",
  "document.manage":      "Manage all documents (admin)",
};

const P = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS) as Permission[],

  ADMIN: [
    P.USER_VIEW, P.USER_CREATE, P.USER_UPDATE, P.USER_DELETE, P.USER_SUSPEND, P.USER_CHANGE_ROLE,
    P.PROJECT_VIEW, P.PROJECT_CREATE, P.PROJECT_UPDATE, P.PROJECT_APPROVE, P.PROJECT_PUBLISH, P.PROJECT_ARCHIVE,
    P.INVESTMENT_VIEW, P.INVESTMENT_APPROVE, P.INVESTMENT_CANCEL,
    P.PAYMENT_VIEW, P.PAYMENT_VERIFY,
    P.WITHDRAWAL_VIEW, P.WITHDRAWAL_APPROVE,
    P.KYC_VIEW, P.KYC_REVIEW, P.KYC_APPROVE,
    P.DISTRIBUTION_VIEW, P.DISTRIBUTION_CREATE, P.DISTRIBUTION_APPROVE, P.DISTRIBUTION_POST, P.DISTRIBUTION_VOID,
    P.REPORT_VIEW,
    P.AUDIT_VIEW,
    P.DOCUMENT_VIEW, P.DOCUMENT_UPLOAD, P.DOCUMENT_DOWNLOAD, P.DOCUMENT_DELETE, P.DOCUMENT_MANAGE,
  ],

  FINANCE_OFFICER: [
    P.PAYMENT_VIEW, P.PAYMENT_VERIFY,
    P.WITHDRAWAL_VIEW, P.WITHDRAWAL_APPROVE,
    P.INVESTMENT_VIEW,
    P.DISTRIBUTION_VIEW, P.DISTRIBUTION_CREATE, P.DISTRIBUTION_APPROVE, P.DISTRIBUTION_POST, P.DISTRIBUTION_VOID,
    P.REPORT_VIEW,
    P.USER_VIEW,
    P.DOCUMENT_VIEW, P.DOCUMENT_UPLOAD, P.DOCUMENT_DOWNLOAD,
  ],

  PROJECT_MANAGER: [
    P.PROJECT_VIEW, P.PROJECT_CREATE, P.PROJECT_UPDATE, P.PROJECT_APPROVE, P.PROJECT_PUBLISH, P.PROJECT_ARCHIVE,
    P.INVESTMENT_VIEW,
    P.DISTRIBUTION_VIEW,
    P.REPORT_VIEW,
    P.USER_VIEW,
    P.DOCUMENT_VIEW, P.DOCUMENT_UPLOAD, P.DOCUMENT_DOWNLOAD,
  ],

  KYC_OFFICER: [
    P.KYC_VIEW, P.KYC_REVIEW, P.KYC_APPROVE,
    P.USER_VIEW,
    P.DOCUMENT_VIEW, P.DOCUMENT_DOWNLOAD,
  ],

  SUPPORT: [
    P.USER_VIEW,
    P.PROJECT_VIEW,
    P.INVESTMENT_VIEW,
    P.KYC_VIEW,
    P.PAYMENT_VIEW,
    P.WITHDRAWAL_VIEW,
    P.DOCUMENT_VIEW,
  ],

  INVESTOR: [
    P.INVESTMENT_VIEW, P.INVESTMENT_CREATE, P.INVESTMENT_CANCEL,
    P.PROJECT_VIEW,
    P.KYC_SUBMIT,
    P.WITHDRAWAL_REQUEST,
    P.DOCUMENT_VIEW, P.DOCUMENT_UPLOAD, P.DOCUMENT_DOWNLOAD,
  ],
};
