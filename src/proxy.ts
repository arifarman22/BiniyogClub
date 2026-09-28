import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that authenticated users should be redirected away from
const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Protected path prefixes — presence of cookie is sufficient here.
// Role enforcement happens server-side in layouts via getSession().
const PROTECTED_PREFIXES = [
  "/investor",
  "/farmer",
  "/admin",
  "/staff",
];

function getSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get("bc_session")?.value;
}

function getDefaultDashboard(): string {
  // After login, redirect to a neutral landing that resolves role server-side
  return "/dashboard";
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = getSessionToken(request);
  const isAuthenticated = Boolean(token);

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL(getDefaultDashboard(), request.url));
  }

  // Enforce authentication on protected portals
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
