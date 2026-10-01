# Security Audit — Biniyog Club

**Date**: 2025  
**Auditor**: Internal  
**Scope**: Full codebase — authentication, authorization, RBAC, IDOR, CSRF, XSS, SQL injection, file uploads, KYC documents, payment webhooks, session security, cookies, CORS, rate limiting, secrets, environment variables, security headers, financial transactions, race conditions, idempotency, privilege escalation.

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3     | ✅ All |
| High     | 4     | ✅ All |
| Medium   | 3     | ✅ All |
| Low / Info | 6   | ✅ All |

---

## Critical Vulnerabilities (Fixed)

### C-1 — IDOR: Investor A can poll Investor B's payment verification
**File**: `src/server/actions/payment.actions.ts`  
**Functions**: `verifyPaymentAction`, `verifyPaymentByProviderIdAction`  
**Description**: Both functions called `requireSession()` but never verified that the `gatewayPaymentId` belonged to the authenticated user's wallet. Any investor could supply another investor's `gatewayPaymentId` and trigger server-side polling against it, observing payment status and potentially racing to activate an investment they did not own.  
**Fix**: Added wallet ownership check — fetches the session user's wallet and asserts `gp.walletId === wallet.id` before proceeding.

### C-2 — Privilege Escalation: Any authenticated user can issue refunds
**File**: `src/server/actions/payment.actions.ts`  
**Function**: `refundPaymentAction`  
**Description**: The function called `requireSession()` but had no permission check. Any authenticated investor could call this server action with any `gatewayPaymentId` and trigger a refund against the payment provider.  
**Fix**: Added `requirePermission(session, PERMISSIONS.PAYMENT_VERIFY)` — only Finance Officers, Admins, and Super Admins can issue refunds.

### C-3 — Race Condition / Overfunding: Admin investment approval lacks row lock
**File**: `src/server/actions/admin.actions.ts`  
**Function**: `approveInvestmentAdminAction`  
**Description**: The transaction incremented `fundedAmountBdt` without first acquiring a `SELECT FOR UPDATE` lock on the investment or project rows. Two concurrent admin approvals for the same project could both read the same `fundedAmountBdt`, both pass the capacity check, and both increment — resulting in overfunding beyond the project's goal.  
**Fix**: Wrapped in a `Serializable` transaction with `SELECT ... FOR UPDATE` on both the investment row (re-checks `PENDING` status) and the project row (re-checks remaining capacity before incrementing).

---

## High Vulnerabilities (Fixed)

### H-1 — Broken Access Control: Project update bypasses ownership check
**File**: `src/server/services/project.service.ts`  
**Function**: `update()`  
**Description**: `farmOwnerId` was hardcoded to `undefined`, so `requireOwnerOrPermission(session, "", PERMISSIONS.PROJECT_UPDATE)` always evaluated the empty-string owner path. Since `session.id !== ""` is always true, the ownership branch never matched, and the permission check was the only gate — but the dead code comment implied farmers/owners could edit without the permission. The logic was misleading and the ownership guard was non-functional.  
**Fix**: Removed the broken `requireOwnerOrPermission` call and replaced with a direct `requirePermission(session, PERMISSIONS.PROJECT_UPDATE)` — all project edits now require explicit staff permission.

### H-2 — Missing Authorization: `streamInvestorPaymentsForExport` has no permission check
**File**: `src/server/data/report.data.ts`  
**Function**: `streamInvestorPaymentsForExport`  
**Description**: Unlike all other export functions in the same file, this function had no `requirePermission` call. Any authenticated user (including investors) could call the report export API with `type=payments` and receive payment data. Staff path was completely unguarded.  
**Fix**: Added role-based branching — staff path requires `PERMISSIONS.REPORT_VIEW`; investor path is scoped to `wallet.userId = session.id`.

### H-3 — Information Leakage: Raw error messages returned to client
**File**: `src/server/actions/auth.actions.ts`  
**Function**: `serviceError()`  
**Description**: Unexpected errors (non-`AppError`) returned `Server error: ${error.message}` directly to the client. This could expose internal implementation details, database error messages, file paths, or stack information.  
**Fix**: Generic message `"An unexpected error occurred. Please try again."` returned for all non-`AppError` exceptions. Full error still logged server-side.

### H-4 — Timing Attack: HMAC comparison uses string equality
**File**: `src/lib/payment/providers/mock.provider.ts`  
**Function**: `verifyWebhook()`  
**Description**: Webhook signature verification used `signature !== expected` (JavaScript string equality), which short-circuits on the first differing character. This allows a timing side-channel attack to brute-force the HMAC byte-by-byte.  
**Fix**: Replaced with `crypto.timingSafeEqual()` on `Buffer` representations of both values, with a length pre-check to avoid exceptions on mismatched lengths.

---

## Medium Vulnerabilities (Fixed)

### M-1 — Missing Security Headers
**File**: `src/proxy.ts` (middleware)  
**Description**: No security headers were set on any response. Missing: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.  
**Fix**: Added all headers in middleware on every response. HSTS only set in production.

### M-2 — Middleware: Forged/expired cookie bypasses edge redirect
**File**: `src/proxy.ts`  
**Description**: The middleware checked `Boolean(cookie_value)` — any non-empty string (including a 1-character forged token) was treated as authenticated. The actual session validation (DB lookup, expiry check) only happens in `getSession()` inside layouts, but the middleware redirect was the first line of defence.  
**Fix**: Added minimum token length check (`>= 32 chars`) at the edge. Real validation still happens in `getSession()` — this is defence-in-depth.

### M-3 — Middleware: Admin routes redirect to wrong login page
**File**: `src/proxy.ts`  
**Description**: Unauthenticated requests to `/admin/*` were redirected to `/auth/login` (investor login) instead of `/admin/login` (staff login).  
**Fix**: Added path-aware redirect — `/admin/*` routes redirect to `/admin/login`.

---

## Low / Informational (Fixed)

### L-1 — Middleware: Protected API routes not guarded at edge
**File**: `src/proxy.ts`  
**Description**: `/api/reports/export`, `/api/documents/*`, and `/api/kyc/documents` had no edge-level authentication check. Unauthenticated requests would reach the route handlers (which do check session), but the middleware provided no early rejection.  
**Fix**: Added `PROTECTED_API_PREFIXES` list with 401 response for unauthenticated requests.

### L-2 — Document Service: Overly broad staff bypass on download
**File**: `src/server/services/document.service.ts`  
**Function**: `getSignedDownloadUrl()`  
**Description**: The access check had a branch: if the user is not the owner and doesn't have role-based access, check `isStaff(role)` — if true, skip the `DOCUMENT_MANAGE` permission check entirely. This meant any staff member (including `SUPPORT` role) could download any private document regardless of their permissions.  
**Fix**: Removed the `isStaff` bypass. All non-owner, non-role-allowed access now requires `PERMISSIONS.DOCUMENT_MANAGE` explicitly.

---

## Tested Attack Scenarios

| Scenario | Result |
|----------|--------|
| Investor A accessing Investor B's payment verification | ✅ Blocked — wallet ownership check |
| Investor calling refund endpoint | ✅ Blocked — PAYMENT_VERIFY permission required |
| Investor calling admin investment approval | ✅ Blocked — INVESTMENT_APPROVE permission required |
| Farmer/Investor calling project update | ✅ Blocked — PROJECT_UPDATE permission required |
| User calling report export without permission | ✅ Blocked — REPORT_VIEW permission required |
| Forged payment webhook (invalid HMAC) | ✅ Blocked — signature verification rejects |
| Duplicate payment webhook (same eventId) | ✅ Blocked — WebhookEvent unique constraint deduplicates |
| Duplicate investment (same idempotencyKey) | ✅ Handled — returns existing investment idempotently |
| Duplicate withdrawal request | ✅ Handled — balance check prevents double-spend |
| Concurrent investment overfunding | ✅ Blocked — Serializable tx + SELECT FOR UPDATE |
| Concurrent admin approval overfunding | ✅ Fixed — now uses Serializable tx + SELECT FOR UPDATE |
| Negative amount investment | ✅ Blocked — Zod schema: `.positive()` |
| Negative amount withdrawal | ✅ Blocked — Zod schema: `.positive()` + `assertPositiveBdt()` |
| Unauthorized document download | ✅ Blocked — owner/role/DOCUMENT_MANAGE check |
| Unauthorized project modification | ✅ Fixed — PROJECT_UPDATE permission required |
| SQL injection via Prisma ORM | ✅ Not applicable — Prisma uses parameterised queries |
| XSS via user input | ✅ Mitigated — React escapes by default; no `dangerouslySetInnerHTML` |
| CSRF on server actions | ✅ Mitigated — Next.js server actions use same-origin POST with CSRF token |
| Session fixation | ✅ Not applicable — new token generated on every login |
| Session after password reset | ✅ All sessions invalidated on password reset |
| Timing attack on HMAC | ✅ Fixed — `timingSafeEqual` used |
| Timing attack on login (user enumeration) | ✅ Mitigated — dummy bcrypt hash run on missing user |
| Privilege escalation to SUPER_ADMIN | ✅ Blocked — only SUPER_ADMIN can assign SUPER_ADMIN role |
| Suspending a SUPER_ADMIN | ✅ Blocked — explicit guard in `suspendUserAction` |

---

## Architecture Strengths (No Action Required)

- **Session tokens**: 256-bit cryptographically random, stored HttpOnly + Secure + SameSite=Lax cookies. No JWT — no algorithm confusion attacks.
- **Password hashing**: bcrypt with 12 rounds.
- **Double-entry ledger**: All financial mutations go through `ledgerService` with immutable entries.
- **Serializable transactions + SELECT FOR UPDATE**: Investment creation, payment activation, and withdrawal reservation all use row-level locking.
- **Webhook deduplication**: `WebhookEvent` table with unique constraint on `(provider, eventId)` prevents replay.
- **Amount cross-check**: Provider-reported amount verified against DB record before activation.
- **KYC ownership**: `kyc.userId === session.id` checked before any document operation.
- **IDOR prevention in investment service**: `assertOwnership()` verifies `investorProfile.userId === session.id` before any investment mutation.
- **Soft deletes**: Users and projects are never hard-deleted; `deletedAt` checked on every session resolution.
- **Audit logs**: All sensitive mutations write to `auditLog` with actor, before, and after state.
- **File validation**: MIME type allowlist + per-category size limits enforced server-side before upload.
- **Cloudinary authenticated resources**: All documents stored as `type: "authenticated"` — direct URL access requires a signed URL with expiry.
- **Mock payment endpoint disabled in production**: `NODE_ENV === "production"` check returns 404.
- **Email enumeration prevention**: `sendPasswordReset` always returns success regardless of whether email exists.

---

## Remaining Recommendations (Not Yet Implemented)

| Item | Priority | Notes |
|------|----------|-------|
| Rate limiting on auth endpoints | High | No rate limiting on `/auth/login`, `/auth/register`, `/auth/forgot-password`. Recommend middleware-level or Upstash Redis rate limiting. |
| Rate limiting on financial actions | High | `createInvestmentAction`, `requestWithdrawalAction` have no per-user rate limit. |
| Content Security Policy (CSP) header | Medium | Full CSP not set — requires careful configuration to avoid breaking Next.js inline scripts. |
| `SameSite=Strict` for session cookie | Low | Currently `SameSite=Lax`. `Strict` would break OAuth flows but provides stronger CSRF protection. |
| KYC document virus scanning | Low | Files are validated by MIME type and size but not scanned for malware before upload to Cloudinary. |
| Withdrawal daily/weekly limits | Medium | No per-user withdrawal frequency or amount limits beyond balance check. |
| Admin action 2FA / re-authentication | Medium | High-privilege actions (role change, user delete, refund) do not require step-up authentication. |
