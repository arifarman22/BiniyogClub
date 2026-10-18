"use server";

import { uploadPaymentProof } from "@/lib/storage/payment-proof";
import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import type { ActionResult } from "./auth.actions";

function svcErr<T>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return { success: false, error: e.message };
  console.error("[upload-proof]", e);
  return { success: false, error: "Upload failed." };
}

export async function uploadPaymentProofAction(
  formData: FormData,
): Promise<ActionResult<{ url: string; mimeType: string }>> {
  try {
    await requireSession();

    const file = formData.get("file");
    if (!(file instanceof File)) return { success: false, error: "No file provided" };

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return { success: false, error: "File must be JPEG, PNG, WebP, or PDF" };
    if (file.size > 10 * 1024 * 1024) return { success: false, error: "File must be smaller than 10 MB" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `payments/proofs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60)}`;
    // Private on Cloudinary; viewable only via /api/payment-proofs.
    const url = await uploadPaymentProof(buffer, key, file.type);

    return { success: true, data: { url, mimeType: file.type } };
  } catch (e) { return svcErr(e); }
}
