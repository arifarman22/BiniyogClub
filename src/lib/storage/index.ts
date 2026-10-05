/**
 * Storage abstraction — Cloudinary provider.
 * All documents are stored as authenticated (private) resources.
 * Never expose storageKey (public_id) directly to the client.
 */

import { v2 as cloudinary } from "cloudinary";
import type { DocumentCategory } from "@/types/prisma";

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
  delete(key: string, mimeType: string): Promise<void>;
  getSignedUrl(key: string, mimeType: string, expiresInSeconds?: number): Promise<string>;
}

function getResourceType(mimeType: string): "image" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  return "raw"; // PDF and all other binary files
}

class CloudinaryProvider implements StorageProvider {
  async upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    configureCloudinary();
    const resourceType = getResourceType(mimeType);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id:     key,
          resource_type: resourceType,
          type:          "authenticated",
          overwrite:     true,
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

  async delete(key: string, mimeType: string): Promise<void> {
    configureCloudinary();
    const resourceType = getResourceType(mimeType);
    await cloudinary.uploader.destroy(key, {
      type:          "authenticated",
      resource_type: resourceType,
      invalidate:    true,
    });
  }

  async getSignedUrl(key: string, mimeType: string, expiresInSeconds = 300): Promise<string> {
    configureCloudinary();
    const resourceType = getResourceType(mimeType);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    // Use private_download_url — works correctly regardless of whether the
    // public_id was stored with or without a file extension.
    const ext = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1] ?? "png";
    return cloudinary.utils.private_download_url(key, ext, {
      resource_type: resourceType,
      type:          "authenticated",
      expires_at:    expiresAt,
      attachment:    true,
    });
  }
}

export const storage: StorageProvider = new CloudinaryProvider();

// ─── Storage key builders ─────────────────────────────────────────────────────

export function buildStorageKey(category: DocumentCategory, entityId: string, filename: string): string {
  const folder = CATEGORY_FOLDERS[category] ?? "documents/misc";
  // Sanitize filename — strip extension, keep alphanumeric + dash
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60);
  return `${folder}/${entityId}/${base}_${Date.now()}`;
}

const CATEGORY_FOLDERS: Record<DocumentCategory, string> = {
  KYC:                    "documents/kyc",
  PROJECT_DOCUMENT:       "documents/projects",
  INVESTMENT_AGREEMENT:   "documents/agreements",
  PAYMENT_RECEIPT:        "documents/receipts/payment",
  INVESTMENT_RECEIPT:     "documents/receipts/investment",
  DISTRIBUTION_STATEMENT: "documents/distributions",
  HARVEST_REPORT:         "documents/harvest",
  FARM_DOCUMENT:          "documents/farm",
};

// ─── File validation ──────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Per-category size limits (bytes)
const CATEGORY_SIZE_LIMITS: Record<DocumentCategory, number> = {
  KYC:                    5  * 1024 * 1024,  // 5 MB
  PROJECT_DOCUMENT:       10 * 1024 * 1024,  // 10 MB
  INVESTMENT_AGREEMENT:   5  * 1024 * 1024,  // 5 MB — generated PDFs
  PAYMENT_RECEIPT:        5  * 1024 * 1024,
  INVESTMENT_RECEIPT:     5  * 1024 * 1024,
  DISTRIBUTION_STATEMENT: 5  * 1024 * 1024,
  HARVEST_REPORT:         10 * 1024 * 1024,
  FARM_DOCUMENT:          10 * 1024 * 1024,
};

export function validateDocumentFile(
  mimeType: string,
  sizeBytes: number,
  category: DocumentCategory,
): string | null {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return "File must be JPEG, PNG, WebP, or PDF";
  }
  const limit = CATEGORY_SIZE_LIMITS[category];
  if (sizeBytes > limit) {
    return `File must be smaller than ${limit / (1024 * 1024)} MB`;
  }
  return null;
}

// ─── Legacy KYC helpers (backwards compat) ───────────────────────────────────

export const ALLOWED_KYC_MIME_TYPES = ALLOWED_MIME_TYPES;
export const MAX_KYC_FILE_SIZE_BYTES = CATEGORY_SIZE_LIMITS.KYC;

export function validateKycFile(mimeType: string, sizeBytes: number): string | null {
  return validateDocumentFile(mimeType, sizeBytes, "KYC");
}
