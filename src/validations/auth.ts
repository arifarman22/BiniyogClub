import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters") // bcrypt limit
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

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

/** True when a YYYY-MM-DD birth date is at least 18 years ago (and not absurdly old). */
function isAdult(isoDate: string) {
  const dob = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  const eighteen = new Date(Date.UTC(dob.getUTCFullYear() + 18, dob.getUTCMonth(), dob.getUTCDate()));
  return eighteen <= now && dob.getUTCFullYear() >= 1900;
}

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters")
      .regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters"),
    email: z.string().email("Enter a valid email address").toLowerCase(),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["INVESTOR", "FARMER"], {
      error: "Select a valid role",
    }),
    nidNumber: nidSchema("NID number"),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth")
      .refine((v) => isAdult(v), "You must be at least 18 years old"),
    presentAddress: z.string().trim().min(5, "Enter your present address").max(300, "Address is too long"),
    permanentAddress: z.string().trim().min(5, "Enter your permanent address").max(300, "Address is too long"),
    // Nominee is optional — blank fields are allowed
    nomineeName: z.string().trim().max(100, "Name must be at most 100 characters").optional().or(z.literal("")),
    nomineeNidNumber: nidSchema("Nominee NID number").optional().or(z.literal("")),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address").toLowerCase(),
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
    newPassword: passwordSchema,
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
