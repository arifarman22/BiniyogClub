# Security Audit — Biniyog Club

**Date**: 2025
**Auditor**: Internal
**Scope**: Full codebase — authentication, authorization, RBAC, IDOR, CSRF, XSS, SQL injection, file uploads, KYC documents, payment webhooks, session security, cookies, rate limiting, secrets, security headers, financial transactions, race conditions, idempotency, privilege escalation, document access.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | ✅ All fixed |
| High | 4 | ✅ All fixed |
| Medium | 3 | ✅ All fixed |
| Low / Info | 6 | ✅ All fixed |

---

## Critical Vulnerabilities (Fixed)

### C-1 — IDOR: Investor A can poll Investor B's payment verification
**File**: `src/server/actions/payment.actions.ts`
**Functions**: `verifyPaymentAction`, `verifyPaymentByProviderIdAction`
**Description**: Both functions called `requireSession()` but never verified that the `gatewayPaymentId` belonged to the authenticated user's wallet. Any investor could supply another investor's `gatewayPaymentId` and trigger server-side polling against it.
**Fix**: Added wallet ownership check — fetches the session user's wallet and asserts `gp.walletId === wallet.id` before proceeding.

### C-2 — Privilege Escalation: Any authenticated user can issue refunds
**File**: `src/server/actions/payment.actions.ts`
**Function**: `refundPaymentAction`
**Description**: The function called `requireSession()` but had no permission check. Any authenticated investor could trigger a refund.
**Fix**: Added `requirePermission(session, PERMISSIONS.PAYMENT_VERIFY)` — only Finance Officers, Admins, and Super Admins can issue refunds.

### C-3 — Race Condition / Overfunding: Admin investment approval lacks row lock
**File**: `src/server/actions/admin.actions.ts`
**Function**: `approveInvestmentAdminAction`
**Description**: The transaction incremented `fundedAmountBdt` without first acquiring a `SELECT FOR UPDATE` lock. Two concurrent admin approvals could both pass the capacity check and both increment — resulting in overfunding.
**Fix**: Wrapped in a `Serializable` transaction with `SELECT ... FOR UPDATE` on both the investment row and the project row.

---

## High Vulnerabilities (Fixed)

### H-1 — Broken Access Control: Project update bypasses ownership check
**File**: `src/server/services/project.service.ts`
**Function**: `update()`
**Description**: `farmOwnerId` was hardcoded to `undefined`, making the ownership guard non-functional.
**Fix**: Replaced with a direct `requirePermission(session, PERMISSIONS.PROJECT_UPDATE)`.

### H-2 — Missing Authorization: `streamInvestorPaymentsForExport` has no permission check
**File**: `src/server/data/report.data.ts`
**Function**: `streamInvestorPaymentsForExport`
**Description**: Unlike all other export functions, this function had no `requirePermission` call. Any authenticated user could access payment export data.
**Fix**: Added role-based branching — staff path requires `PERMISSIONS.REPORT_VIEW`; investor path is scoped to their own wallet.

### H-3 — Information Leakage: Raw error messages returned to client
**File**: `src/server/actions/auth.actions.ts`
**Description**: Unexpected errors returned `Server error: ${error.message}` directly to the client, potentially exposing internal details.
**Fix**: Generic message `"An unexpected error occurred. Please try again."` returned for all non-`AppError` exceptions.

### H-4 — Timing Attack: HMAC comparison uses string equality
**File**: `src/lib/payment/providers/mock.provider.ts`
**Function**: `verifyWebhook()`
**Description**: Webhook signature verification used `signature !== expected` (JavaScript string equality), allowing a timing side-channel attack.
**Fix**: Replaced with `crypto.timingSafeEqual()` on `Buffer` representations.

---

## Medium Vulnerabilities (Fixed)

### M-1 — Missing Security Headers
**File**: `src/proxy.ts`
**Description**: No security headers were set. Missing: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
**Fix**: Added all headers in middleware on every response. HSTS only set in production.

### M-2 — Middleware: Forged/expired cookie bypasses edge redirect
**File**: `src/proxy.ts`
**Description**: The middleware checked `Boolean(cookie_value)` — any non-empty string was treated as authenticated.
**Fix**: Added minimum token length check (`>= 32 chars`) at the edge. Real validation still happens in `getSession()`.

### M-3 — Middleware: Admin routes redirect to wrong login page
**File**: `src/proxy.ts`
**Description**: Unauthenticated requests to `/admin/*` were redirected to `/auth/login` instead of `/admin/login`.
**Fix**: Added path-aware redirect — `/admin/*` routes redirect to `/admin/login`.

---

## Low / Informational (Fixed)

### L-1 — Middleware: Protected API routes not guarded at edge
**File**: `src/proxy.ts`
**Description**: `/api/reports/export`, `/api/documents/*`, and `/api/kyc/documents` had no edge-level authentication check.
**Fix**: Added `PROTECTED_API_PREFIXES` list with 401 response for unauthenticated requests.

### L-2 — Document Service: Overly broad staff bypass on download
**File**: `src/server/services/document.service.ts`
**Function**: `getSignedDownloadUrl()`
**Description**: Any staff member (including `SUPPORT`) could download any private document regardless of permissions.
**Fix**: Removed the `isStaff` bypass. All non-owner, non-role-allowed access now requires `PERMISSIONS.DOCUMENT_MANAGE` explicitly.

### L-3 — Document FK: `entityId` not validated against Project
**File**: `src/server/services/document.service.ts`
**Function**: `generateInvestmentAgreement()` (original)
**Description**: The original function used `entityType: "INVESTMENT"` and `entityId: investmentId`, violating the hard FK constraint on `Document.entityId → Project.id`.
**Fix**: Rewrote as `generateInvestmentReceipt()` using `entityType: "PROJECT"` and `entityId: project.id`.

### L-4 — Document Category: Wrong category for investor receipts
**Description**: Original code used `INVESTMENT_AGREEMENT` category for investor-visible receipts, making them invisible on the investor documents page which queries `INVESTMENT_RECEIPT`.
**Fix**: New `generateInvestmentReceipt()` uses `category: "INVESTMENT_RECEIPT"`.

### L-5 — Document Generation: Session permission check blocked system-level generation
**Description**: Original `generateInvestmentAgreement()` required a session with `DOCUMENT_MANAGE` permission, blocking fire-and-forget generation after payment confirmation.
**Fix**: `generateInvestmentReceipt()` has no session parameter — it's always called server-side after confirmed payment.

### L-6 — PDF Download: Browser displays PDF inline instead of downloading
**File**: `src/lib/storage/index.ts`
**Function**: `getSignedUrl()`
**Description**: Cloudinary `private_download_url` served PDFs with `Content-Disposition: inline`, causing the browser to display rather than download.
**Fix**: Added `attachment: true` to force `Content-Disposition: attachment`.

---

## Tested Attack Scenarios

| Scenario | Result |
|----------|--------|
| Investor A accessing Investor B's payment verification | ✅ Blocked — wallet ownership check |
| Investor calling refund endpoint | ✅ Blocked — PAYMENT_VERIFY permission required |
| Investor calling admin investment approval | ✅ Blocked — INVESTMENT_APPROVE permission required |
| Investor calling project update | ✅ Blocked — PROJECT_UPDATE permission required |
| User calling report export without permission | ✅ Blocked — REPORT_VIEW permission required |
| Forged payment webhook (invalid HMAC) | ✅ Blocked — signature verification rejects |
| Duplicate payment webhook (same eventId) | ✅ Blocked — WebhookEvent unique constraint deduplicates |
| Duplicate investment (same idempotencyKey) | ✅ Handled — returns existing investment idempotently |
| Duplicate withdrawal request | ✅ Handled — balance check prevents double-spend |
| Concurrent investment overfunding | ✅ Blocked — Serializable tx + SELECT FOR UPDATE |
| Concurrent admin approval overfunding | ✅ Fixed — Serializable tx + SELECT FOR UPDATE |
| Negative amount investment | ✅ Blocked — Zod schema `.positive()` |
| Negative amount withdrawal | ✅ Blocked — Zod schema `.positive()` + `assertPositiveBdt()` |
| Unauthorized document download | ✅ Blocked — owner/role/DOCUMENT_MANAGE check |
| Unauthorized project modification | ✅ Fixed — PROJECT_UPDATE permission required |
| SQL injection via Prisma ORM | ✅ Not applicable — Prisma uses parameterised queries |
| XSS via user input | ✅ Mitigated — React escapes by default |
| CSRF on server actions | ✅ Mitigated — Next.js server actions use same-origin POST |
| Session fixation | ✅ Not applicable — new token generated on every login |
| Session after password reset | ✅ All sessions invalidated on password reset |
| Timing attack on HMAC | ✅ Fixed — `timingSafeEqual` used |
| Timing attack on login (user enumeration) | ✅ Mitigated — dummy bcrypt hash run on missing user |
| Privilege escalation to SUPER_ADMIN | ✅ Blocked — only SUPER_ADMIN can assign SUPER_ADMIN role |
| Suspending a SUPER_ADMIN | ✅ Blocked — explicit guard in `suspendUserAction` |
| Accessing another user's documents | ✅ Blocked — ownerUserId check |
| Mock payment endpoint in production | ✅ Blocked — returns 404 when `NODE_ENV === "production"` |

---

## Architecture Strengths

- **Session tokens**: 256-bit cryptographically random, stored HttpOnly + Secure + SameSite=Lax. No JWT — no algorithm confusion attacks.
- **Password hashing**: bcrypt with 12 rounds.
- **Double-entry ledger**: All financial mutations go through `ledgerService` with immutable entries.
- **Serializable transactions + SELECT FOR UPDATE**: Investment creation, payment activation, and withdrawal reservation all use row-level locking.
- **Webhook deduplication**: `WebhookEvent` table with unique constraint on `(provider, eventId)` prevents replay.
- **Amount cross-check**: Provider-reported amount verified against DB record before activation.
- **KYC ownership**: `kyc.userId === session.id` checked before any document operation.
- **IDOR prevention in investment service**: `assertOwnership()` verifies `investorProfile.userId === session.id` before any investment mutation.
- **Soft deletes**: Users and projects are never hard-deleted; `deletedAt` checked on every session resolution.
- **Audit logs**: All sensitive mutations write to `auditLog` with actor, before, and after state.
- **Document audit logs**: Every UPLOAD, DOWNLOAD, DELETE, GENERATE action is logged with IP and user agent.
- **File validation**: MIME type allowlist + per-category size limits enforced server-side before upload.
- **Cloudinary authenticated resources**: All documents stored as `type: "authenticated"` — direct URL access requires a signed URL with expiry.
- **Email enumeration prevention**: `sendPasswordReset` / `sendOtp` always returns success regardless of whether email exists.
- **Idempotency keys**: Investment creation and withdrawal requests use idempotency keys to prevent duplicates.

---

## Remaining Recommendations

| Item | Priority | Notes |
|------|----------|-------|
| Rate limiting on auth endpoints | High | No rate limiting on `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| Rate limiting on financial actions | High | `createInvestmentAction`, `requestWithdrawalAction` have no per-user rate limit |
| Content Security Policy (CSP) header | Medium | Full CSP not set — requires careful configuration for Next.js inline scripts |
| Withdrawal daily/weekly limits | Medium | No per-user withdrawal frequency or amount limits beyond balance check |
| Admin action 2FA / re-authentication | Medium | High-privilege actions (role change, user delete, refund) don't require step-up auth |
| KYC document virus scanning | Low | Files validated by MIME/size but not scanned for malware before Cloudinary upload |
| `SameSite=Strict` for session cookie | Low | Currently `SameSite=Lax`. `Strict` would break OAuth flows but provides stronger CSRF protection |
