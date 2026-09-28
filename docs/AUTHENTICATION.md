# Biniyog Club — Authentication

## Overview

Authentication uses **database-backed sessions** with **HttpOnly cookies**. There are no JWTs stored client-side. Every authenticated request resolves the session by looking up a random token in the `sessions` table.

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

For an investment platform where account suspension and instant revocation are critical, DB sessions are the correct choice.

---

## Registration Flow

```
1. User submits: name, email, phone, password, role
2. Zod validates all fields (server-side in Server Action)
3. Check email uniqueness → ConflictError if taken
4. Check phone uniqueness → ConflictError if taken
5. bcrypt.hash(password, 12) → passwordHash
6. INSERT user (emailVerified=false, status=ACTIVE)
7. Generate 64-byte secure token → INSERT verification_token (24h expiry)
8. Send verification email (fire-and-forget — does not block registration)
9. Return success → UI shows "check your email" screen
```

**Password never stored in plaintext. Never returned in any response.**

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

Tokens are single-use. Expired or used tokens return `InvalidTokenError`.

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

The login handler always runs `bcrypt.compare()` regardless of whether the user exists. This prevents an attacker from measuring response time to determine if an email is registered.

```typescript
const dummyHash = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
const passwordHash = user?.passwordHash ?? dummyHash;
const valid = await verifyPassword(password, passwordHash);
if (!user || !valid) throw new UnauthorizedError("Invalid email or password");
```

---

## Session Resolution

Every server-side auth check calls `getSession()`:

```typescript
// src/lib/auth/session.ts
export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionCookie();          // Read HttpOnly cookie
  if (!token) return null;

  const session = await db.session.findUnique({    // Single indexed DB lookup
    where: { token },
    select: { expiresAt: true, user: { ... } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null; // Expired
  if (session.user.deletedAt) return null;         // Soft-deleted
  if (session.user.status !== "ACTIVE") return null; // Suspended

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

`logoutAll()` deletes all sessions for the user — signs out all devices.

---

## Password Reset Flow

```
1. User submits email
2. Look up user — if not found, SILENTLY SUCCEED (prevents email enumeration)
3. Delete any existing PASSWORD_RESET tokens for this user
4. Generate 64-byte token → INSERT verification_token (1h expiry)
5. Send password reset email with link: /auth/reset-password?token=<hex>
6. User clicks link → ResetPasswordForm reads token from URL
7. User submits new password + token
8. Validate token: exists, type=PASSWORD_RESET, usedAt=null, expiresAt > now
9. bcrypt.hash(newPassword, 12)
10. UPDATE user SET passwordHash=<new>
11. UPDATE token SET usedAt=now
12. DELETE all sessions for this user (force re-login everywhere)
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

## Cookie Configuration

```typescript
{
  name: "bc_session",
  httpOnly: true,           // Not accessible via JavaScript
  secure: true,             // HTTPS only in production
  sameSite: "lax",          // CSRF protection for cross-site navigation
  path: "/",
  maxAge: 604800,           // 7 days in seconds
}
```

`sameSite: "lax"` allows the cookie to be sent on top-level navigations (e.g. clicking a link from another site) but blocks it on cross-site POST requests — the primary CSRF vector.

---

## Token Security

| Token type | Length | Entropy | Expiry |
|---|---|---|---|
| Session | 64 hex chars | 256 bits | 7 days |
| Email verification | 64 hex chars | 256 bits | 24 hours |
| Password reset | 64 hex chars | 256 bits | 1 hour |
| OTP | 6 digits | ~20 bits | 10 minutes |

All tokens use `crypto.getRandomValues()` — cryptographically secure PRNG.

OTPs are intentionally short-lived and numeric for UX. They are stored hashed in future iterations (current: plaintext in DB, acceptable for 10-minute window).

---

## Rate Limiting Architecture

Rate limiting is **not yet implemented** but the architecture is ready for it. The proxy (`src/proxy.ts`) intercepts every request before it reaches route handlers. Add rate limiting there:

```typescript
// Future: src/lib/rate-limit/index.ts
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  // Redis INCR + EXPIRE pattern
  // Throw RateLimitedError if exceeded
}

// In proxy.ts or Server Actions:
await rateLimit(`login:${ip}`, 5, 60);       // 5 attempts per minute
await rateLimit(`register:${ip}`, 3, 3600);  // 3 per hour
await rateLimit(`reset:${email}`, 3, 3600);  // 3 per hour
```

---

## Role-Based Authorization

Roles: `INVESTOR`, `FARMER`, `FIELD_OFFICER`, `ADMIN`

Authorization is enforced at two layers:

1. **Layout level** — `(investor)/layout.tsx`, `(farmer)/layout.tsx`, `(admin)/layout.tsx` call `getSession()` and redirect if role doesn't match
2. **Server Action / Route Handler level** — `requireRole("ADMIN")` throws `ForbiddenError`

The proxy (`src/proxy.ts`) only checks cookie presence — not role. Role enforcement always happens server-side after DB lookup.

---

## Security Considerations

| Threat | Mitigation |
|---|---|
| Password brute force | bcrypt cost factor 12 (~300ms/hash), rate limiting ready |
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
    crypto.ts          # hashPassword, verifyPassword, generateSecureToken, generateOtp, safeCompare
    cookies.ts         # setSessionCookie, getSessionCookie, clearSessionCookie
    session.ts         # getSession, requireSession, requireRole, requireEmailVerified
  server/
    services/
      auth.service.ts  # register, login, logout, logoutAll, verifyEmail,
                       # sendPasswordReset, resetPassword, changePassword, sendOtp, verifyOtp
    actions/
      auth.actions.ts  # Server Actions — thin validation wrappers over authService
  validations/
    auth.ts            # registerSchema, loginSchema, forgotPasswordSchema,
                       # resetPasswordSchema, changePasswordSchema, otpSchema
  db/repositories/
    user.repository.ts    # findByEmail, findByPhone, create, updatePassword, verifyEmail
    token.repository.ts   # create, findByToken, markUsed, deleteByUserAndType
    session.repository.ts # create, deleteByToken, deleteByUserId, deleteExpired
  components/auth/
    auth-card.tsx          # Shared auth page shell
    login-form.tsx         # Login form (client)
    register-form.tsx      # Registration form (client)
    forgot-password-form.tsx
    reset-password-form.tsx
  app/(auth)/auth/
    login/page.tsx
    register/page.tsx
    verify-email/page.tsx  # Server component — processes token from URL
    forgot-password/page.tsx
    reset-password/page.tsx
```
