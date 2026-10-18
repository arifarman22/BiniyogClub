/**
 * One-off: switches payment proofs uploaded before the privacy fix from public
 * (`upload`) to private (`authenticated`) on Cloudinary, so their old links
 * stop working. Stored URLs are left as they are — /api/payment-proofs reads
 * both kinds.
 *
 *   node scripts/make-payment-proofs-private.mjs           # dry run: lists what would change
 *   node scripts/make-payment-proofs-private.mjs --apply   # makes them private
 *
 * Deploy the /api/payment-proofs route first: older builds link to the public URL.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const apply = process.argv.includes("--apply");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/** Same parsing as src/lib/storage/payment-proof.ts, limited to public assets. */
function parsePublic(stored) {
  let url;
  try { url = new URL(stored); } catch { return null; }
  if (url.hostname !== "res.cloudinary.com") return null;
  const [cloud, resourceType, type, ...rest] = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (cloud !== process.env.CLOUDINARY_CLOUD_NAME || type !== "upload") return null;
  if (resourceType !== "image" && resourceType !== "raw") return null;
  const path = rest.filter((p) => !/^v\d+$/.test(p)).join("/");
  if (resourceType === "raw") return { resourceType, publicId: path };
  const dot = path.lastIndexOf(".");
  return { resourceType, publicId: dot > 0 ? path.slice(0, dot) : path };
}

const db = new PrismaClient();
const select = { proofFileUrl: true };
const rows = [
  ...(await db.manualPaymentSubmission.findMany({ select })),
  ...(await db.groupInvestmentPayment.findMany({ select })),
];
const assets = new Map();
for (const { proofFileUrl } of rows) {
  const a = proofFileUrl && parsePublic(proofFileUrl);
  if (a) assets.set(`${a.resourceType}:${a.publicId}`, a);
}

console.log(`${rows.length} proof rows, ${assets.size} public Cloudinary assets${apply ? "" : " (dry run)"}`);
let done = 0, failed = 0;
for (const a of assets.values()) {
  if (!apply) { console.log(`  would make private: [${a.resourceType}] ${a.publicId}`); continue; }
  try {
    await cloudinary.uploader.rename(a.publicId, a.publicId, {
      resource_type: a.resourceType, type: "upload", to_type: "authenticated", invalidate: true,
    });
    done++;
    console.log(`  private: [${a.resourceType}] ${a.publicId}`);
  } catch (e) {
    // "Resource not found" means it was already moved by an earlier run.
    failed++;
    console.log(`  skipped: [${a.resourceType}] ${a.publicId} — ${e?.message ?? e?.error?.message ?? e}`);
  }
}
if (apply) console.log(`Done: ${done} made private, ${failed} skipped`);
await db.$disconnect();
