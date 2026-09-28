"use server";

import { kycService } from "@/server/services/kyc.service";
import {
  kycSubmitSchema,
  kycApproveSchema,
  kycRejectSchema,
  kycRequestResubmissionSchema,
} from "@/validations/kyc";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationError<T>(
  issues: { path: (string | number | symbol)[]; message: string }[],
): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path.join("."));
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    success: false,
    error: issues[0]?.message ?? "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors,
  };
}

function serviceError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
  console.error("[kyc action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Investor actions ─────────────────────────────────────────────────────────

export async function saveDraftAction(formData: unknown): Promise<ActionResult<{ kycId: string }>> {
  const parsed = kycSubmitSchema.partial().safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const kyc = await kycService.saveDraft(session, parsed.data);
    revalidatePath("/dashboard/kyc");
    return { success: true, data: { kycId: kyc.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult<{ documentId: string }>> {
  try {
    const session = await requireSession();

    const kycId = formData.get("kycId");
    const documentType = formData.get("documentType");
    const file = formData.get("file");

    if (typeof kycId !== "string" || typeof documentType !== "string" || !(file instanceof File)) {
      return { success: false, error: "Invalid upload request", code: "VALIDATION_ERROR" };
    }

    const allowedTypes = ["NATIONAL_ID", "PASSPORT", "DRIVING_LICENSE"];
    if (!allowedTypes.includes(documentType)) {
      return { success: false, error: "Invalid document type", code: "VALIDATION_ERROR" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await kycService.uploadDocument(
      session,
      kycId,
      documentType,
      buffer,
      file.type,
      file.size,
    );

    revalidatePath("/dashboard/kyc");
    revalidatePath("/dashboard/kyc/submit");
    return { success: true, data: { documentId: doc.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function deleteDocumentAction(documentId: string): Promise<ActionResult<void>> {
  if (!documentId) return { success: false, error: "Document ID required" };

  try {
    const session = await requireSession();
    await kycService.deleteDocument(session, documentId);
    revalidatePath("/dashboard/kyc");
    revalidatePath("/dashboard/kyc/submit");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function submitKycAction(): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await kycService.submit(session);
    revalidatePath("/dashboard/kyc");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Admin actions ────────────────────────────────────────────────────────────

export async function startKycReviewAction(kycId: string): Promise<ActionResult<void>> {
  if (!kycId) return { success: false, error: "KYC ID required" };

  try {
    const session = await requireSession();
    await kycService.startReview(session, kycId);
    revalidatePath("/admin/kyc");
    revalidatePath(`/admin/kyc/${kycId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function verifyKycAction(formData: unknown): Promise<ActionResult<void>> {
  const parsed = kycApproveSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await kycService.verify(session, parsed.data.kycId);
    revalidatePath("/admin/kyc");
    revalidatePath(`/admin/kyc/${parsed.data.kycId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function rejectKycAction(formData: unknown): Promise<ActionResult<void>> {
  const parsed = kycRejectSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await kycService.reject(session, parsed.data.kycId, parsed.data.reviewNote);
    revalidatePath("/admin/kyc");
    revalidatePath(`/admin/kyc/${parsed.data.kycId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function requestResubmissionAction(formData: unknown): Promise<ActionResult<void>> {
  const parsed = kycRequestResubmissionSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await kycService.requestResubmission(session, parsed.data.kycId, parsed.data.reviewNote);
    revalidatePath("/admin/kyc");
    revalidatePath(`/admin/kyc/${parsed.data.kycId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
