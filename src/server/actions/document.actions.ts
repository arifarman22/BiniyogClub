"use server";

import { documentService } from "@/server/services/document.service";
import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";
import type { DocumentCategory, DocumentEntityType } from "@/types/prisma";

function serviceError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
  console.error("[document action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const session = await requireSession();

    const file        = formData.get("file");
    const category    = formData.get("category") as DocumentCategory;
    const entityType  = formData.get("entityType") as DocumentEntityType;
    const entityId    = formData.get("entityId") as string;
    const name        = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const isPublic    = formData.get("isPublic") === "true";

    if (!(file instanceof File) || !category || !entityType || !entityId || !name) {
      return { success: false, error: "Missing required fields", code: "VALIDATION_ERROR" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await documentService.upload(session, {
      file:        buffer,
      filename:    file.name,
      mimeType:    file.type,
      sizeBytes:   file.size,
      category,
      entityType,
      entityId,
      name,
      description: description ?? undefined,
      isPublic,
    });

    revalidatePath("/dashboard/documents");
    revalidatePath("/admin/documents");
    return { success: true, data: { documentId: doc.id } };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Download (get signed URL) ────────────────────────────────────────────────

export async function getDocumentDownloadUrlAction(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await requireSession();
    const url = await documentService.getSignedDownloadUrl(session, documentId);
    return { success: true, data: { url } };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteDocumentAction(
  documentId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await documentService.deleteDocument(session, documentId);
    revalidatePath("/dashboard/documents");
    revalidatePath("/admin/documents");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Generate investment agreement ───────────────────────────────────────────

export async function generateInvestmentAgreementAction(
  investmentId: string,
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const session = await requireSession();
    const result = await documentService.generateInvestmentAgreement(session, investmentId);
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/investments`);
    return { success: true, data: { documentId: result.documentId } };
  } catch (error) {
    return serviceError(error);
  }
}
