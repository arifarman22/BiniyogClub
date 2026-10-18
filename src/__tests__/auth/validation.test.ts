import { describe, it, expect } from "vitest";
import {
  registerSchema,
  investorProfileSchema,
  dmyToIso,
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
    dateOfBirth: "01/01/1990",
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

  it("allows the email to be left blank", () => {
    expect(registerSchema.safeParse({ ...valid, email: "" }).success).toBe(true);
    const { email: _email, ...noEmail } = valid;
    expect(registerSchema.safeParse(noEmail).success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects an invalid email when one is given", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects invalid BD phone number", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("accepts +8801 prefix phone", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "+8801712345678" }).success).toBe(true);
  });

  it("requires date of birth as DD/MM/YYYY", () => {
    expect(registerSchema.safeParse({ ...valid, dateOfBirth: "1990-01-01" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, dateOfBirth: "31/02/1990" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, dateOfBirth: "29/02/1992" }).success).toBe(true);
  });

  it("rejects an investor younger than 18", () => {
    const d = new Date();
    const dmy = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() - 17}`;
    expect(registerSchema.safeParse({ ...valid, dateOfBirth: dmy }).success).toBe(false);
  });

  it("accepts any password of 6+ characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "simple", confirmPassword: "simple" }).success).toBe(true);
  });

  it("rejects password shorter than 6 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Sh0rt", confirmPassword: "Sh0rt" }).success).toBe(false);
  });

  it("rejects a mismatched password confirmation", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "Different1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("rejects invalid role", () => {
    expect(registerSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false);
  });
});

describe("dmyToIso", () => {
  it("converts real dates and rejects impossible ones", () => {
    expect(dmyToIso("05/11/1988")).toBe("1988-11-05");
    expect(dmyToIso("31/04/2000")).toBeNull();
    expect(dmyToIso("5/11/1988")).toBeNull();
  });
});

describe("investorProfileSchema", () => {
  const base = { name: "Rahim Uddin", phone: "01712345678", dateOfBirth: "01/01/1990" };
  const address = { line: "House 1, Road 2", division: "Dhaka", district: "Dhaka", thana: "Dhanmondi", postalCode: "1209" };

  it("accepts the minimum (identity extras are optional)", () => {
    expect(investorProfileSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a full profile", () => {
    expect(investorProfileSchema.safeParse({
      ...base, email: "r@example.com", nidNumber: "1234567890",
      presentAddress: address, permanentAddress: address, nomineeName: "Karim", nomineeNidNumber: "0987654321",
    }).success).toBe(true);
  });

  it("requires every part of an address once given", () => {
    expect(investorProfileSchema.safeParse({ ...base, presentAddress: { ...address, thana: "" } }).success).toBe(false);
    expect(investorProfileSchema.safeParse({ ...base, presentAddress: { ...address, postalCode: "12" } }).success).toBe(false);
  });

  it("validates NIDs when given", () => {
    expect(investorProfileSchema.safeParse({ ...base, nidNumber: "12ab" }).success).toBe(false);
    expect(investorProfileSchema.safeParse({ ...base, nomineeNidNumber: "12" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a Bangladeshi phone number as the identifier", () => {
    const r = loginSchema.safeParse({ email: "01712345678", password: "x" });
    expect(r.success && r.data.email).toBe("01712345678");
  });

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

  it("uses the same 6-character rule as registration", () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: "simple", confirmPassword: "simple" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: "short", confirmPassword: "short" }).success).toBe(false);
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
