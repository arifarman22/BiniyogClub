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
    nidNumber: z
      .string()
      .min(10, "NID number must be at least 10 digits")
      .max(17, "NID number must be at most 17 digits")
      .regex(/^\d+$/, "NID number must contain only digits"),
    nomineeNidNumber: z
      .string()
      .min(10, "Nominee NID number must be at least 10 digits")
      .max(17, "Nominee NID number must be at most 17 digits")
      .regex(/^\d+$/, "Nominee NID number must contain only digits"),
    nomineeRelation: z
      .string()
      .min(2, "Relation is required")
      .max(50, "Relation must be at most 50 characters"),
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
