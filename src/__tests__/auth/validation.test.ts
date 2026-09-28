import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  otpSchema,
} from "@/validations/auth";

// ─── registerSchema ───────────────────────────────────────────────────────────

describe("registerSchema", () => {
  const valid = {
    name: "Rahim Uddin",
    email: "rahim@example.com",
    phone: "01712345678",
    password: "SecurePass1",
    confirmPassword: "SecurePass1",
    role: "INVESTOR" as const,
  };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises email to lowercase", () => {
    const result = registerSchema.safeParse({ ...valid, email: "RAHIM@EXAMPLE.COM" });
    expect(result.success && result.data.email).toBe("rahim@example.com");
  });

  it("rejects name shorter than 2 characters", () => {
    const r = registerSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid BD phone number", () => {
    const r = registerSchema.safeParse({ ...valid, phone: "12345" });
    expect(r.success).toBe(false);
  });

  it("accepts +8801 prefix phone", () => {
    const r = registerSchema.safeParse({ ...valid, phone: "+8801712345678" });
    expect(r.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const r = registerSchema.safeParse({ ...valid, password: "lowercase1", confirmPassword: "lowercase1" });
    expect(r.success).toBe(false);
  });

  it("rejects password without number", () => {
    const r = registerSchema.safeParse({ ...valid, password: "NoNumbers!", confirmPassword: "NoNumbers!" });
    expect(r.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const r = registerSchema.safeParse({ ...valid, password: "Sh0rt", confirmPassword: "Sh0rt" });
    expect(r.success).toBe(false);
  });

  it("rejects mismatched confirmPassword", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "DifferentPass1" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects invalid role", () => {
    const r = registerSchema.safeParse({ ...valid, role: "ADMIN" });
    expect(r.success).toBe(false);
  });
});

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "anypass" }).success).toBe(true);
  });

  it("normalises email to lowercase", () => {
    const r = loginSchema.safeParse({ email: "USER@EXAMPLE.COM", password: "pass" });
    expect(r.success && r.data.email).toBe("user@example.com");
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "bad", password: "pass" }).success).toBe(false);
  });
});

// ─── forgotPasswordSchema ─────────────────────────────────────────────────────

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "notanemail" }).success).toBe(false);
  });
});

// ─── resetPasswordSchema ──────────────────────────────────────────────────────

describe("resetPasswordSchema", () => {
  const valid = { token: "abc123token", password: "NewPass1234", confirmPassword: "NewPass1234" };

  it("accepts valid input", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing token", () => {
    expect(resetPasswordSchema.safeParse({ ...valid, token: "" }).success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const r = resetPasswordSchema.safeParse({ ...valid, confirmPassword: "Different1" });
    expect(r.success).toBe(false);
  });
});

// ─── changePasswordSchema ─────────────────────────────────────────────────────

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "OldPass1234",
    newPassword: "NewPass5678",
    confirmPassword: "NewPass5678",
  };

  it("accepts valid input", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when new password equals current password", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "SamePass1",
      newPassword: "SamePass1",
      confirmPassword: "SamePass1",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("newPassword");
    }
  });

  it("rejects mismatched confirmPassword", () => {
    const r = changePasswordSchema.safeParse({ ...valid, confirmPassword: "WrongPass1" });
    expect(r.success).toBe(false);
  });
});

// ─── otpSchema ────────────────────────────────────────────────────────────────

describe("otpSchema", () => {
  it("accepts a 6-digit OTP", () => {
    expect(otpSchema.safeParse({ otp: "123456" }).success).toBe(true);
  });

  it("rejects OTP shorter than 6 digits", () => {
    expect(otpSchema.safeParse({ otp: "12345" }).success).toBe(false);
  });

  it("rejects OTP longer than 6 digits", () => {
    expect(otpSchema.safeParse({ otp: "1234567" }).success).toBe(false);
  });

  it("rejects non-numeric OTP", () => {
    expect(otpSchema.safeParse({ otp: "12345a" }).success).toBe(false);
  });
});
