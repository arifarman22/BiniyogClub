import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { kycRepository } from "@/db/repositories/kyc.repository";
import { kycService } from "@/server/services/kyc.service";
import { canStatic } from "@/lib/authz";
import type { RouteContext } from "@/types";

/**
 * GET /api/kyc/documents/[key]
 *
 * Serves a short-lived signed URL redirect for a KYC document.
 * The [key] param is the document ID (not the storage key).
 * Authorization: owner or staff with kyc.view permission.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: documentId } = await params;

  // Validate it looks like a UUID to prevent path traversal
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const doc = await kycRepository.findDocumentById(documentId);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kyc = await kycRepository.findById(doc.kycId);
    if (!kyc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Authorization: owner or staff with kyc.view
    const isOwner = kyc.userId === session.id;
    const isStaffWithAccess = canStatic(session.role, "kyc.view");

    if (!isOwner && !isStaffWithAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signedUrl = await kycService.getDocumentSignedUrl(session, documentId);

    // Redirect to signed URL — client never sees the storage key
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (err) {
    console.error("[kyc/documents] error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
