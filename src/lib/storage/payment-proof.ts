/**
 * Payment proofs (transfer screenshots, cheque photos, money receipts).
 *
 * Proofs are stored on Cloudinary as `authenticated` (private) assets and are
 * only ever served through GET /api/payment-proofs/[kind]/[id], which checks
 * who is asking. The stored Cloudinary URL must never be sent to a browser.
 *
 * Older proofs were uploaded as public (`upload`) assets; fetchPaymentProof
 * handles both, so they keep working before and after being made private
 * (scripts/make-payment-proofs-private.ts).
 */

import { v2 as cloudinary } from "cloudinary";

export type ProofKind = "manual" | "group";

export const PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

/** The only URL a page may receive for a proof. Empty when there is no proof (e.g. cash). */
export const proofViewPath = (kind: ProofKind, id: string, storedUrl: string | null | undefined) =>
  storedUrl ? `/api/payment-proofs/${kind}/${id}` : "";

/** Swaps the stored Cloudinary URL for the guarded view path on a row bound for the client. */
export function secureProof<T extends { id: string; proofFileUrl: string | null }>(kind: ProofKind, row: T): T {
  return { ...row, proofFileUrl: proofViewPath(kind, row.id, row.proofFileUrl) };
}

/**
 * Uploads a proof as a private asset. Returns its delivery URL with the
 * signature stripped, so the value handed back to the uploader is an
 * identifier, not a working link.
 */
export async function uploadPaymentProof(file: Buffer, publicId: string, mimeType: string): Promise<string> {
  configure();
  const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: resourceType, type: "authenticated", overwrite: true },
      (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res)),
    );
    stream.end(file);
  });
  return result.secure_url.replace(/\/s--[^/]+--\//, "/");
}

type ParsedAsset = { resourceType: "image" | "raw"; type: string; publicId: string; format?: string };

/**
 * Reads a stored proof URL. Returns null unless it points at this account's
 * Cloudinary cloud — the URL originally came from the client, so this is
 * also what stops the proxy being used to fetch arbitrary hosts.
 */
export function parseProofUrl(storedUrl: string): ParsedAsset | null {
  let url: URL;
  try { url = new URL(storedUrl); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;

  const [cloud, resourceType, type, ...rest] = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (cloud !== process.env.CLOUDINARY_CLOUD_NAME) return null;
  if (resourceType !== "image" && resourceType !== "raw") return null;
  if (type !== "upload" && type !== "authenticated") return null;

  const parts = rest.filter((p) => !/^s--.+--$/.test(p) && !/^v\d+$/.test(p));
  const path = parts.join("/");
  if (!path) return null;

  // Raw assets keep their extension in the public_id; images carry it as the format.
  if (resourceType === "raw") return { resourceType, type, publicId: path };
  const dot = path.lastIndexOf(".");
  return dot > 0
    ? { resourceType, type, publicId: path.slice(0, dot), format: path.slice(dot + 1) }
    : { resourceType, type, publicId: path };
}

/** Fetches a proof's bytes server-side, or null if it can't be found. */
export async function fetchPaymentProof(storedUrl: string): Promise<ArrayBuffer | null> {
  const asset = parseProofUrl(storedUrl);
  if (!asset) return null;
  configure();

  // Signed delivery URLs are refused for private raw files (PDFs), so those go
  // through the short-lived download API instead.
  const signedPrivate = asset.resourceType === "raw"
    ? cloudinary.utils.private_download_url(asset.publicId, "", {
        resource_type: "raw",
        type:          "authenticated",
        expires_at:    Math.floor(Date.now() / 1000) + 60,
      })
    : cloudinary.url(asset.publicId, {
        resource_type: asset.resourceType,
        type:          "authenticated",
        sign_url:      true,
        secure:        true,
        // The analytics tag reads the SDK's version, which the Next bundle drops ("Must supply sdk_semver").
        urlAnalytics:  false,
        ...(asset.format && { format: asset.format }),
      });
  // A legacy public proof may not have been made private yet — try it as stored too.
  const candidates = asset.type === "upload" ? [signedPrivate, storedUrl] : [signedPrivate];

  for (const href of candidates) {
    const res = await fetch(href, { cache: "no-store" });
    if (res.ok) return res.arrayBuffer();
  }
  return null;
}
