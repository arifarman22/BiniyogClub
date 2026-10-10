import { z } from "zod";

export const CONTACT_INQUIRY_TYPES = [
  "Investor Relations & Onboarding",
  "Business Group & Project Partnership",
  "Corporate Syndicate / Large Allocation",
  "Deposit & Payment Verification",
  "Legal, KYC & Compliance Inquiry",
  "General Questions & Feedback",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  inquiryType: z.enum(CONTACT_INQUIRY_TYPES),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.input<typeof contactSchema>;
