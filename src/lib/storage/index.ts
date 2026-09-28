/**
 * Storage abstraction layer.
 * KYC documents are private — never expose storageKey or generate public URLs.
 * Use getSignedUrl() to generate short-lived access URLs server-side only.
 */

export interface UploadResult {
  key: string;
}

export interface StorageProvider {
  upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  /** Returns a short-lived signed URL. expiresInSeconds defaults to 300 (5 min). */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

// Local/stub provider for development — replace with S3Provider in production
class LocalStorageProvider implements StorageProvider {
  async upload(_file: Buffer, key: string, _mime: string): Promise<UploadResult> {
    // TODO: write to local filesystem under /tmp/uploads/ for dev
    return { key };
  }

  async delete(_key: string): Promise<void> {
    // TODO: delete from local filesystem
  }

  async getSignedUrl(key: string, _expiresInSeconds = 300): Promise<string> {
    // In dev, route through the private API endpoint
    return `/api/kyc/documents/${encodeURIComponent(key)}`;
  }
}

export const storage: StorageProvider = new LocalStorageProvider();

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
