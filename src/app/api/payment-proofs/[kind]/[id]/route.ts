import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { db } from "@/lib/db/prisma";
import { fetchPaymentProof, PROOF_MIME_TYPES } from "@/lib/storage/payment-proof";
import type { RouteContext } from "@/types";

/**
 * GET /api/payment-proofs/[kind]/[id]
 *
 * Streams a payment proof inline. kind is "manual" (project payments) or
 * "group" (group investment payments); id is the submission ID.
 * Authorization: the investor who submitted it, or staff who review payments.
 * Proofs are private on Cloudinary, so this is the only way to view them.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kind, id } = await params;
  if ((kind !== "manual" && kind !== "group") || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const select = { submittedBy: true, proofFileUrl: true, proofMimeType: true } as const;
  const proof = kind === "manual"
    ? await db.manualPaymentSubmission.findUnique({ where: { id }, select })
    : await db.groupInvestmentPayment.findUnique({ where: { id }, select });
  if (!proof?.proofFileUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    proof.submittedBy === session.id ||
    (await can(session, PERMISSIONS.PAYMENT_VIEW)) ||
    (kind === "group" && (await can(session, PERMISSIONS.GROUP_MANAGE)));
  // 404 rather than 403, so IDs can't be probed for existence.
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await fetchPaymentProof(proof.proofFileUrl);
  if (!body) return NextResponse.json({ error: "Proof unavailable" }, { status: 502 });

  // Only ever serve the expected file types, never whatever the client claimed.
  const contentType = (PROOF_MIME_TYPES as readonly string[]).includes(proof.proofMimeType)
    ? proof.proofMimeType
    : "application/octet-stream";

  return new NextResponse(body, {
    headers: {
      "Content-Type":           contentType,
      "Content-Disposition":    `inline; filename="payment-proof-${id.slice(0, 8)}"`,
      "Cache-Control":          "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
