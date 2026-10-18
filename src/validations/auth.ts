import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

/**
 * Password rules — the single source for both validation and the live
 * checklist shown while typing, so the two can never disagree.
 */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8, error: "Password must be at least 8 characters" },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p), error: "Must contain at least one uppercase letter" },
  { id: "lower", label: "One lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p), error: "Must contain at least one lowercase letter" },
  { id: "number", label: "One number (0–9)", test: (p: string) => /[0-9]/.test(p), error: "Must contain at least one number" },
] as const;

export const PASSWORD_MAX_LENGTH = 72; // bcrypt limit

export const passwordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .superRefine((password, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(password)) ctx.addIssue({ code: "custom", message: rule.error });
    }
  });

// BD phone: +8801XXXXXXXXX or 01XXXXXXXXX
export const phoneSchema = z
  .string()
  .regex(/^(\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number");

// ─── Registration ─────────────────────────────────────────────────────────────

const nidSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(10, `${label} must be at least 10 digits`)
    .max(17, `${label} must be at most 17 digits`)
    .regex(/^\d+$/, `${label} must contain only digits`);

/** A Bangladeshi address: house/road line plus division → district → thana and postal code. */
export const bdAddressSchema = z.object({
  line: z.string().trim().min(3, "Enter house, road and area").max(200, "Address is too long"),
  division: z.string().trim().min(1, "Select a division"),
  district: z.string().trim().min(1, "Select a district"),
  thana: z.string().trim().min(1, "Select or enter your thana").max(100, "Thana is too long"),
  postalCode: z.string().trim().regex(/^\d{4}$/, "Postal code must be 4 digits"),
});
export type BdAddress = z.infer<typeof bdAddressSchema>;

/** One-line form of an address, e.g. for display and the profile summary. */
export const formatBdAddress = (a: BdAddress) =>
  [a.line, a.thana, a.district, a.division].filter(Boolean).join(", ") + (a.postalCode ? ` - ${a.postalCode}` : "");

/** True when a YYYY-MM-DD birth date is at least 18 years ago (and not absurdly old). */
function isAdult(isoDate: string) {
  const dob = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  const eighteen = new Date(Date.UTC(dob.getUTCFullYear() + 18, dob.getUTCMonth(), dob.getUTCDate()));
  return eighteen <= now && dob.getUTCFullYear() >= 1900;
}

/** "DD/MM/YYYY" → "YYYY-MM-DD", or null when it isn't a real calendar date. */
export function dmyToIso(dmy: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
  if (d.getUTCFullYear() !== +yyyy || d.getUTCMonth() !== +mm - 1 || d.getUTCDate() !== +dd) return null;
  return `${yyyy}-${mm}-${dd}`;
}

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters")
  .regex(/^[\p{L}\s.'-]+$/u, "Name contains invalid characters");

/** Optional email — blank is allowed. */
const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""));

/** Date of birth typed as DD/MM/YYYY; must be a real date and 18+. */
const dobDmySchema = z
  .string()
  .trim()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Enter your date of birth as DD/MM/YYYY")
  .refine((v) => dmyToIso(v) !== null, "Enter a real date (DD/MM/YYYY)")
  .refine((v) => isAdult(dmyToIso(v) ?? ""), "You must be at least 18 years old");

/**
 * Signup is kept short. Identity details (NID, addresses, nominee) are added
 * later from the investor's profile — see investorProfileSchema.
 */
/** Account password rule — shared by signup and the profile's change-password form. */
export const ACCOUNT_PASSWORD_MIN = 6;
export const accountPasswordSchema = z
  .string()
  .min(ACCOUNT_PASSWORD_MIN, `Password must be at least ${ACCOUNT_PASSWORD_MIN} characters`);

export const registerSchema = z
  .object({
    name: nameSchema,
    email: optionalEmailSchema,
    phone: phoneSchema,
    dateOfBirth: dobDmySchema,
    password: accountPasswordSchema,
    confirmPassword: z.string(),
    role: z.enum(["INVESTOR", "FARMER"], {
      error: "Select a valid role",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Everything an investor can edit on their profile (the former signup details). */
export const investorProfileSchema = z.object({
  name: nameSchema,
  email: optionalEmailSchema,
  phone: phoneSchema,
  dateOfBirth: dobDmySchema,
  nidNumber: nidSchema("NID number").optional().or(z.literal("")),
  presentAddress: bdAddressSchema.optional(),
  permanentAddress: bdAddressSchema.optional(),
  nomineeName: z.string().trim().max(100, "Name must be at most 100 characters").optional().or(z.literal("")),
  nomineeNidNumber: nidSchema("Nominee NID number").optional().or(z.literal("")),
});
export type InvestorProfileInput = z.infer<typeof investorProfileSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────

/** Login identifier: an email address or a Bangladeshi phone number. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email or phone number")
    .refine(
      (v) => z.string().email().safeParse(v).success || /^(\+8801|01)[3-9]\d{8}$/.test(v.replace(/[\s-]/g, "")),
      "Enter a valid email or Bangladeshi phone number",
    )
    .transform((v) => (v.includes("@") ? v.toLowerCase() : v.replace(/[\s-]/g, ""))),
  password: z.string().min(1, "Password is required"),
});

// ─── Password Reset ───────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address").toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Password Change (authenticated) ─────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: accountPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"],
  });

// ─── OTP ──────────────────────────────────────────────────────────────────────

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
