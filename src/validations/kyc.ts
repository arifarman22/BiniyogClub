import { z } from "zod";

// BD phone: +8801XXXXXXXXX or 01XXXXXXXXX
const bdPhone = z
  .string()
  .regex(/^(\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number");

export const kycPersonalSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100)
    .regex(/^[\p{L}\s'.,-]+$/u, "Name contains invalid characters"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD)")
    .refine((d) => {
      const dob = new Date(d);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18 && age <= 120;
    }, "You must be at least 18 years old"),
  nationality: z.string().min(2).max(3).default("BD"),
});

export const kycAddressSchema = z.object({
  addressLine: z.string().min(5, "Enter your full address").max(200),
  city: z.string().min(2).max(100),
  district: z.string().min(2).max(100),
  division: z.string().min(2).max(100),
  postalCode: z.string().max(10).optional(),
});

export const kycIdentitySchema = z.object({
  documentType: z.enum(
    ["NATIONAL_ID", "PASSPORT", "DRIVING_LICENSE"],
    { error: "Select a valid document type" },
  ),
  documentNumber: z
    .string()
    .min(4, "Document number is required")
    .max(30)
    .regex(/^[A-Z0-9\-]+$/i, "Document number contains invalid characters"),
});

export const kycBankSchema = z.object({
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z
    .string()
    .max(30)
    .regex(/^[0-9\-]+$/, "Account number must contain only digits")
    .optional()
    .or(z.literal("")),
  mobileProvider: z.enum(["bKash", "Nagad", "Rocket", "Upay", "SureCash", ""]).optional(),
  mobileNumber: bdPhone.optional().or(z.literal("")),
}).refine(
  (d) => d.bankAccountNumber || d.mobileNumber,
  { message: "Provide at least one payment method (bank account or mobile banking)", path: ["bankAccountNumber"] },
);

export const kycSubmitSchema = kycPersonalSchema
  .merge(kycAddressSchema)
  .merge(kycIdentitySchema)
  .merge(kycBankSchema);

export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;

// ─── Admin review actions ─────────────────────────────────────────────────────

export const kycApproveSchema = z.object({
  kycId: z.string().uuid(),
});

export const kycRejectSchema = z.object({
  kycId: z.string().uuid(),
  reviewNote: z.string().min(10, "Provide a reason (at least 10 characters)").max(500),
});

export const kycRequestResubmissionSchema = z.object({
  kycId: z.string().uuid(),
  reviewNote: z.string().min(10, "Provide instructions (at least 10 characters)").max(500),
});

export type KycApproveInput = z.infer<typeof kycApproveSchema>;
export type KycRejectInput = z.infer<typeof kycRejectSchema>;
export type KycRequestResubmissionInput = z.infer<typeof kycRequestResubmissionSchema>;
