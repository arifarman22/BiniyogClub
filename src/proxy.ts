import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/investor",
  "/farmer",
  "/admin",
  "/staff",
];

// Login pages must never be protected — prevents infinite redirect loops
const PUBLIC_EXCEPTIONS = [
  "/admin/login",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// API routes that require authentication (block unauthenticated access at edge)
const PROTECTED_API_PREFIXES = [
  "/api/reports",
  "/api/documents",
  "/api/kyc",
];

const SESSION_COOKIE_NAME = "bc_session";

// Minimum token length — our tokens are 64 hex chars (32 bytes)
const MIN_TOKEN_LENGTH = 32;

function getSessionToken(request: NextRequest): string | undefined {
  const value = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  // Reject obviously invalid tokens at the edge (real validation happens in getSession())
  if (!value || value.length < MIN_TOKEN_LENGTH) return undefined;
  return value;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = getSessionToken(request);
  const isAuthenticated = Boolean(token);

  // Enforce authentication on protected page routes
  const isPublicException = PUBLIC_EXCEPTIONS.some((p) => pathname.startsWith(p));
  const isProtectedPage = !isPublicException && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL(
      pathname.startsWith("/admin") ? "/admin/login" : "/auth/login",
      request.url,
    );
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce authentication on protected API routes
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtectedApi && !isAuthenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const response = NextResponse.next();

  // ── Security headers ────────────────────────────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
