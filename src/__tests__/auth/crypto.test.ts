import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateOtp,
  safeCompare,
} from "@/lib/auth/crypto";

describe("hashPassword", () => {
  it("produces a bcrypt hash", async () => {
    const hash = await hashPassword("TestPass1");
    expect(hash).toMatch(/^\$2[ab]\$12\$/);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const h1 = await hashPassword("TestPass1");
    const h2 = await hashPassword("TestPass1");
    expect(h1).not.toBe(h2);
  });

  it("does not return the plaintext password", async () => {
    const hash = await hashPassword("TestPass1");
    expect(hash).not.toContain("TestPass1");
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("CorrectPass1");
    expect(await verifyPassword("CorrectPass1", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("CorrectPass1");
    expect(await verifyPassword("WrongPass1", hash)).toBe(false);
  });

  it("returns false for empty string", async () => {
    const hash = await hashPassword("CorrectPass1");
    expect(await verifyPassword("", hash)).toBe(false);
  });
});

describe("generateSecureToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("generateOtp", () => {
  it("returns a 6-digit numeric string by default", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("respects custom length", () => {
    expect(generateOtp(4)).toHaveLength(4);
    expect(generateOtp(8)).toHaveLength(8);
  });

  it("generates different OTPs across calls", () => {
    const otps = new Set(Array.from({ length: 50 }, () => generateOtp()));
    expect(otps.size).toBeGreaterThan(1);
  });
});

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeCompare("abc123", "abc124")).toBe(false);
  });

  it("returns false for different length strings", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(safeCompare("", "")).toBe(true);
  });
});
