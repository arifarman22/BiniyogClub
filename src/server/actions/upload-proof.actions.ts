"use server";

import { v2 as cloudinary } from "cloudinary";
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

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `payments/proofs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60)}`;
    const resourceType = file.type === "application/pdf" ? "raw" : "image";

    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: key, resource_type: resourceType, type: "upload", overwrite: true },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });

    return { success: true, data: { url, mimeType: file.type } };
  } catch (e) { return svcErr(e); }
}
