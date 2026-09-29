/**
 * Storage abstraction — Cloudinary provider.
 * KYC documents are uploaded to a private folder and accessed via signed URLs.
 * Never expose storageKey (public_id) directly to the client.
 */

import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

export interface UploadResult {
  key: string; // Cloudinary public_id
}

export interface StorageProvider {
  upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

class CloudinaryProvider implements StorageProvider {
  async upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    configureCloudinary();
    const resourceType = mimeType === "application/pdf" ? "raw" : "image";

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id:     key,
          resource_type: resourceType,
          // Private delivery type — not publicly accessible
          type:          "authenticated",
          overwrite:     true,
          // Never apply transformations to identity documents
          invalidate:    true,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
          resolve({ key: result.public_id });
        },
      );
      stream.end(file);
    });
  }

  async delete(key: string): Promise<void> {
    configureCloudinary();
    await cloudinary.uploader.destroy(key, {
      type:          "authenticated",
      resource_type: "image",
      invalidate:    true,
    });
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    configureCloudinary();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.url(key, {
      type:          "authenticated",
      resource_type: "image",
      sign_url:      true,
      expires_at:    expiresAt,
      secure:        true,
    });
  }
}

export const storage: StorageProvider = new CloudinaryProvider();

// ─── Allowed KYC document MIME types ─────────────────────────────────────────

export const ALLOWED_KYC_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedKycMimeType = (typeof ALLOWED_KYC_MIME_TYPES)[number];

export const MAX_KYC_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateKycFile(mimeType: string, sizeBytes: number): string | null {
  if (!ALLOWED_KYC_MIME_TYPES.includes(mimeType as AllowedKycMimeType)) {
    return "File must be JPEG, PNG, WebP, or PDF";
  }
  if (sizeBytes > MAX_KYC_FILE_SIZE_BYTES) {
    return "File must be smaller than 5 MB";
  }
  return null;
}
