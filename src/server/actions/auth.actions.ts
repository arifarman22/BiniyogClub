"use server";

import { authService } from "@/server/services/auth.service";
import {
  registerSchema,
  dmyToIso,
  investorProfileSchema,
  formatBdAddress,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  otpSchema,
} from "@/validations/auth";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// ─── Result type ──────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; fieldErrors?: Record<string, string> };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationError(issues: { path: (string | number | symbol)[]; message: string }[]): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    success: false,
    error: issues[0]?.message ?? "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors,
  };
}

function serviceError(error: unknown): ActionResult {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }
  // Never leak internal error details to the client
  console.error("[action error]", error instanceof Error ? error.message : error);
  return { success: false, error: "An unexpected error occurred. Please try again." };
}

async function getRequestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ipAddress: (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined)
      ?.split(",")[0]
      ?.trim(),
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function registerAction(formData: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const input = parsed.data;
    await authService.register({
      ...input,
      email: input.email || null,
      dateOfBirth: dmyToIso(input.dateOfBirth)!, // validated as DD/MM/YYYY
      role: input.role as "INVESTOR",
    });
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function loginAction(formData: unknown): Promise<ActionResult<{ role: string }>> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues) as ActionResult<{ role: string }>;

  try {
    const meta = await getRequestMeta();
    const user = await authService.login(parsed.data, meta);
    return { success: true, data: { role: user.role } };
  } catch (error) {
    return serviceError(error) as ActionResult<{ role: string }>;
  }
}

export async function logoutAction(): Promise<void> {
  await authService.logout();
  redirect("/auth/login");
}

export async function logoutAllAction(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await authService.logoutAll(session.id);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token || typeof token !== "string") {
    return { success: false, error: "Invalid verification token", code: "INVALID_TOKEN" };
  }

  try {
    await authService.verifyEmail(token);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function resendVerificationEmailAction(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (session.emailVerified) {
      return { success: false, error: "Email is already verified", code: "ALREADY_VERIFIED" };
    }
    if (!session.email) {
      return { success: false, error: "Add an email address to your profile first", code: "NO_EMAIL" };
    }
    await authService.sendVerificationEmail(session.id, session.email, session.name);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function forgotPasswordAction(formData: unknown): Promise<ActionResult<{ found: boolean }>> {
  const parsed = forgotPasswordSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues) as ActionResult<{ found: boolean }>;

  try {
    const found = await authService.sendPasswordResetOtp(parsed.data.email);
    return { success: true, data: { found } };
  } catch (error) {
    return serviceError(error) as ActionResult<{ found: boolean }>;
  }
}

export async function verifyPasswordResetOtpAction(email: string, otp: string): Promise<ActionResult<{ resetToken: string }>> {
  if (!email || !otp) return { success: false, error: "Invalid request" };
  try {
    const resetToken = await authService.verifyPasswordResetOtp(email, otp);
    return { success: true, data: { resetToken } };
  } catch (error) {
    return serviceError(error) as ActionResult<{ resetToken: string }>;
  }
}

export async function resetPasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function changePasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await authService.changePassword(
      session.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function updateAvatarAction(formData: FormData): Promise<ActionResult<{ avatarUrl: string }>> {
  try {
    const session = await requireSession();
    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) return { success: false, error: "No file provided" };
    if (file.size > 3 * 1024 * 1024) return { success: false, error: "Image must be under 3 MB" };
    if (!file.type.startsWith("image/")) return { success: false, error: "File must be an image" };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "avatars", public_id: `avatar_${session.id}`, overwrite: true, resource_type: "image", quality: "auto:good", fetch_format: "auto", transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }] },
        (err, res) => err || !res ? reject(err) : resolve(res),
      ).end(buffer);
    });

    await db.user.update({ where: { id: session.id }, data: { avatarUrl: result.secure_url } });
    return { success: true, data: { avatarUrl: result.secure_url } };
  } catch (error) {
    return serviceError(error) as ActionResult<{ avatarUrl: string }>;
  }
}

/**
 * Investor identity details — the fields that used to be part of signup
 * (email, DOB, NID, addresses, nominee). Saved to the user, investor profile
 * and KYC record together.
 */
export async function updateIdentityDetailsAction(formData: unknown): Promise<ActionResult> {
  const parsed = investorProfileSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const d = parsed.data;
    const email = d.email?.trim().toLowerCase() || null;
    const nid = d.nidNumber?.trim() || null;
    const dob = new Date(`${dmyToIso(d.dateOfBirth)}T00:00:00Z`);

    const [emailTaken, phoneTaken, nidTaken] = await Promise.all([
      email ? db.user.findFirst({ where: { email, id: { not: session.id } }, select: { id: true } }) : null,
      db.user.findFirst({ where: { phone: d.phone, id: { not: session.id } }, select: { id: true } }),
      nid ? db.investorProfile.findFirst({ where: { nationalId: nid, userId: { not: session.id } }, select: { id: true } }) : null,
    ]);
    if (emailTaken) return { success: false, error: "That email is already used by another account" };
    if (phoneTaken) return { success: false, error: "That phone number is already used by another account" };
    if (nidTaken) return { success: false, error: "That NID number is already registered" };

    const present = d.presentAddress;
    const permanent = d.permanentAddress;

    await db.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id: session.id }, select: { email: true } });
      await tx.user.update({
        where: { id: session.id },
        data: {
          name: d.name,
          phone: d.phone,
          email,
          // A changed email isn't verified until confirmed again.
          ...(email !== current?.email ? { emailVerified: false } : {}),
        },
      });

      const profile = {
        nationalId: nid,
        dateOfBirth: dob,
        nomineeName: d.nomineeName?.trim() || null,
        nomineeNationalId: d.nomineeNidNumber?.trim() || null,
        ...(present ? { address: formatBdAddress(present), city: present.district } : {}),
      };
      await tx.investorProfile.upsert({
        where: { userId: session.id },
        create: { userId: session.id, country: "BD", ...profile },
        update: profile,
      });

      const kyc = {
        fullName: d.name,
        dateOfBirth: dob,
        mobileNumber: d.phone,
        documentType: nid ? ("NATIONAL_ID" as const) : null,
        documentNumber: nid,
        ...(present ? {
          presentAddress: present.line, presentDivision: present.division, presentDistrict: present.district,
          presentUpazila: present.thana, presentPostalCode: present.postalCode,
          city: present.district, district: present.district, division: present.division, postalCode: present.postalCode,
        } : {}),
        ...(permanent ? {
          permanentAddress: permanent.line, permanentDivision: permanent.division, permanentDistrict: permanent.district,
          permanentUpazila: permanent.thana, permanentPostalCode: permanent.postalCode,
        } : {}),
      };
      await tx.kyc.upsert({
        where: { userId: session.id },
        create: { userId: session.id, ...kyc },
        update: kyc,
      });
    });

    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function updateProfileAction(data: {
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  occupation?: string;
  annualIncomeRange?: string;
  investmentExperience?: string;
  riskTolerance?: string;
  address?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const { name, phone, city, country, occupation, annualIncomeRange, investmentExperience, riskTolerance, address } = data;

    await db.$transaction(async (tx) => {
      if (name || phone !== undefined) {
        await tx.user.update({
          where: { id: session.id },
          data: {
            ...(name ? { name: name.trim() } : {}),
            ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
          },
        });
      }
      await tx.investorProfile.upsert({
        where: { userId: session.id },
        create: {
          userId: session.id,
          city: city?.trim() || null,
          country: country?.trim() || "BD",
          occupation: occupation?.trim() || null,
          annualIncomeRange: annualIncomeRange?.trim() || null,
          investmentExperience: investmentExperience?.trim() || null,
          riskTolerance: riskTolerance?.trim() || null,
          address: address?.trim() || null,
        },
        update: {
          ...(city !== undefined ? { city: city.trim() || null } : {}),
          ...(country ? { country: country.trim() } : {}),
          ...(occupation !== undefined ? { occupation: occupation.trim() || null } : {}),
          ...(annualIncomeRange !== undefined ? { annualIncomeRange: annualIncomeRange.trim() || null } : {}),
          ...(investmentExperience !== undefined ? { investmentExperience: investmentExperience.trim() || null } : {}),
          ...(riskTolerance !== undefined ? { riskTolerance: riskTolerance.trim() || null } : {}),
          ...(address !== undefined ? { address: address.trim() || null } : {}),
        },
      });
    });
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function deleteAvatarAction(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
    await cloudinary.uploader.destroy(`avatars/avatar_${session.id}`, { resource_type: "image" }).catch(() => {});
    await db.user.update({ where: { id: session.id }, data: { avatarUrl: null } });
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function verifyOtpAction(userId: string, formData: unknown): Promise<ActionResult> {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Invalid request", code: "VALIDATION_ERROR" };
  }

  const parsed = otpSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    await authService.verifyOtp(userId, parsed.data.otp);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
