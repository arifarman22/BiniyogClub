# Biniyog Club — Authentication

## Overview

Authentication uses **database-backed sessions** with **HttpOnly cookies**. There are no JWTs stored client-side. Every authenticated request resolves the session by looking up a random token in the `sessions` table.

There are two separate auth portals:
- **Investor auth**: `/auth/*` — registration, login, email verification, forgot/reset password with OTP
- **Staff auth**: `/admin/login` — separate login page for admin/staff roles

---

## Architecture

```
Browser
  │  HttpOnly cookie: bc_session=<64-char hex token>
  ▼
Next.js Server (RSC / Server Action / Route Handler)
  │  getSession() → reads cookie → DB lookup → SessionUser
  ▼
sessions table
  │  token → userId → User row
  ▼
users table
```

### Why database sessions instead of JWT?

| Concern | JWT (stateless) | DB Session (stateful) |
|---|---|---|
| Instant revocation | ❌ Must wait for expiry | ✅ Delete row |
| Logout all devices | ❌ Not possible | ✅ Delete by userId |
| Suspend user | ❌ Token still valid | ✅ Checked on every request |
| Token size in cookie | Larger (~200 bytes) | Small (64 hex chars) |
| DB hit per request | None | One indexed lookup |

---

## Registration Flow

```
1. User submits: name, email, phone, password
2. Zod validates all fields (server-side in Server Action)
3. Check email uniqueness → ConflictError if taken
4. Check phone uniqueness → ConflictError if taken
5. bcrypt.hash(password, 12) → passwordHash
6. INSERT user (emailVerified=false, status=ACTIVE, role=INVESTOR)
7. Generate 64-byte secure token → INSERT verification_token (24h expiry, type=EMAIL_VERIFICATION)
8. Send verification email (fire-and-forget)
9. Return success → UI shows "check your email" screen
```

---

## Email Verification Flow

```
1. User clicks link: /auth/verify-email?token=<hex>
2. Server Action: verifyEmailAction(token)
3. Look up token in verification_tokens
4. Validate: exists, type=EMAIL_VERIFICATION, usedAt=null, expiresAt > now
5. UPDATE user SET emailVerified=true
6. UPDATE token SET usedAt=now (one-time use)
7. Redirect to login
```

---

## Login Flow

```
1. User submits: email, password
2. Zod validates
3. Look up user by email
4. Run bcrypt.compare() — even if user not found (timing attack prevention)
5. If user not found OR password wrong → UnauthorizedError (same message)
6. If user.deletedAt is set → UnauthorizedError
7. If user.status === SUSPENDED → ForbiddenError
8. If user.emailVerified === false → EmailNotVerifiedError
9. Generate 64-byte session token
10. INSERT session (userId, token, expiresAt=+7days, userAgent, ipAddress)
11. Set HttpOnly cookie: bc_session=<token>
12. Return safe user object (no passwordHash)
```

### Timing attack prevention

The login handler always runs `bcrypt.compare()` regardless of whether the user exists:

```typescript
const dummyHash = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
const passwordHash = user?.passwordHash ?? dummyHash;
const valid = await verifyPassword(password, passwordHash);
if (!user || !valid) throw new UnauthorizedError("Invalid email or password");
```

---

## Forgot Password — OTP Flow

```
1. User submits email on /auth/forgot-password
2. Look up user — if not found, SILENTLY SUCCEED (prevents email enumeration)
3. Generate 6-digit OTP → INSERT verification_token (10min expiry, type=OTP)
4. Send OTP email via Resend
5. User enters OTP + new password on the same page
6. Validate OTP: exists, type=OTP, usedAt=null, expiresAt > now
7. bcrypt.hash(newPassword, 12)
8. UPDATE user SET passwordHash=<new>
9. UPDATE token SET usedAt=now
10. DELETE all sessions for this user (force re-login everywhere)
11. Redirect to login
```

---

## Password Change Flow (Authenticated)

```
1. Authenticated user submits: currentPassword, newPassword, confirmPassword
2. requireSession() — must be logged in
3. Verify currentPassword against stored hash
4. Validate newPassword !== currentPassword
5. bcrypt.hash(newPassword, 12)
6. UPDATE user SET passwordHash=<new>
7. DELETE all sessions for this user
8. CREATE new session (keeps current device logged in)
9. Send "password changed" notification email
```

---

## Session Resolution

Every server-side auth check calls `getSession()`:

```typescript
export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { ... } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;   // Expired
  if (session.user.deletedAt) return null;            // Soft-deleted
  if (session.user.status !== "ACTIVE") return null;  // Suspended

  return sessionUser;
}
```

`requireSession()` throws `UnauthorizedError` if null.
`requireRole(...roles)` throws `ForbiddenError` if role not in list.

---

## Logout Flow

```
1. Read bc_session cookie value
2. DELETE session row from DB (instant revocation)
3. Overwrite cookie with maxAge=0 (browser deletes it)
4. Redirect to /
```

---

## Cookie Configuration

```typescript
{
  name: "bc_session",
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only in production
  sameSite: "lax",     // CSRF protection for cross-site navigation
  path: "/",
  maxAge: 604800,      // 7 days in seconds
}
```

---

## Token Security

| Token type | Length | Entropy | Expiry |
|---|---|---|---|
| Session | 64 hex chars | 256 bits | 7 days |
| Email verification | 64 hex chars | 256 bits | 24 hours |
| OTP (forgot password) | 6 digits | ~20 bits | 10 minutes |

All tokens use `crypto.getRandomValues()` — cryptographically secure PRNG.

---

## Staff Authentication

Staff (ADMIN, SUPER_ADMIN, FINANCE_OFFICER, etc.) log in via `/admin/login` using `AdminLoginForm`. The same session mechanism is used — the only difference is the login page and the role check in `(admin)/layout.tsx`:

```typescript
// (admin)/layout.tsx
if (!session) redirect("/admin/login");
if (!["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "SUPPORT"].includes(session.role)) {
  redirect("/unauthorized");
}
```

---

## Security Considerations

| Threat | Mitigation |
|---|---|
| Password brute force | bcrypt cost factor 12 (~300ms/hash) |
| Credential stuffing | Same error message for wrong email/password |
| Timing attacks | Always run bcrypt even for non-existent users |
| XSS token theft | HttpOnly cookie — JS cannot read it |
| CSRF | SameSite=Lax cookie, Server Actions use POST |
| Session fixation | New token generated on every login |
| Session hijacking | Secure flag in production (HTTPS only) |
| Email enumeration | Forgot password always returns success |
| Token reuse | Verification tokens marked `usedAt` after first use |
| Stale sessions after password change | All sessions deleted on password reset/change |
| Soft-deleted user access | `deletedAt` checked on every session resolution |
| Suspended user access | `status` checked on every session resolution |

---

## File Map

```
src/
  lib/auth/
    crypto.ts          # hashPassword, verifyPassword, generateSecureToken, generateOtp
    cookies.ts         # setSessionCookie, getSessionCookie, clearSessionCookie
    session.ts         # getSession, requireSession, requireRole
  server/
    services/
      auth.service.ts  # register, login, logout, verifyEmail,
                       # sendOtp, verifyOtpAndResetPassword, changePassword
    actions/
      auth.actions.ts  # Server Actions — thin wrappers over authService
  validations/
    auth.ts            # registerSchema, loginSchema, forgotPasswordSchema,
                       # resetPasswordSchema, changePasswordSchema, otpSchema
  components/auth/
    login-form.tsx
    register-form.tsx
    forgot-password-form.tsx   # OTP-based flow
    reset-password-form.tsx
    admin-login-form.tsx       # Staff login
    staff-login-form.tsx
  app/(auth)/auth/
    login/page.tsx
    register/page.tsx
    verify-email/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  app/(staff-auth)/admin/
    login/page.tsx
```
