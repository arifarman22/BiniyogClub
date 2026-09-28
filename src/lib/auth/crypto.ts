import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure 64-character hex token.
 * Used for: session tokens, email verification, password reset.
 * 32 bytes = 256 bits of entropy — safe against brute force.
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a numeric OTP of the given length.
 * Uses crypto.getRandomValues for uniform distribution.
 */
export function generateOtp(length = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => String(b % 10)).join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
