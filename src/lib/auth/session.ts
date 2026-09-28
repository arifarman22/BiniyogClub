import { getSessionCookie } from "./cookies";
import { db } from "@/lib/db/prisma";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import type { UserRole } from "@/types/prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  status: string;
  emailVerified: boolean;
}

/**
 * Resolves the current session from the HttpOnly cookie.
 * Single indexed DB lookup — no JWT decode.
 * Returns null if unauthenticated, expired, suspended, or soft-deleted.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const token = await getSessionCookie();
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    if (!session.user) return null;
    if (session.user.deletedAt) return null;
    if (session.user.status !== "ACTIVE") return null;

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      phone: session.user.phone,
      role: session.user.role,
      status: session.user.status,
      emailVerified: session.user.emailVerified,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * Requires the user to have one of the specified roles.
 * For permission-level checks, prefer requirePermission() from authz.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new ForbiddenError();
  return session;
}

export async function requireEmailVerified(): Promise<SessionUser> {
  const session = await requireSession();
  if (!session.emailVerified) {
    throw new ForbiddenError("Please verify your email address before continuing");
  }
  return session;
}
