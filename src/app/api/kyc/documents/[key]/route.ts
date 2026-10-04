import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { kycRepository } from "@/db/repositories/kyc.repository";
import { kycService } from "@/server/services/kyc.service";
import { canStatic } from "@/lib/authz";
import type { RouteContext } from "@/types";

/**
 * GET /api/kyc/documents/[key]
 *
 * Fetches the document from Cloudinary server-side and streams it back
 * with Content-Disposition: inline so it opens in the browser tab.
 * The [key] param is the document ID (not the storage key).
 * Authorization: owner or staff with kyc.view permission.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: documentId } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(documentId)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const doc = await kycRepository.findDocumentById(documentId);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kyc = await kycRepository.findById(doc.kycId);
    if (!kyc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = kyc.userId === session.id;
    const isStaffWithAccess = canStatic(session.role, "kyc.view");
    if (!isOwner && !isStaffWithAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const downloadUrl = await kycService.getDocumentSignedUrl(session, documentId);

    // Fetch from Cloudinary server-side and proxy back inline
    // so the browser opens/displays it rather than downloading.
    const upstream = await fetch(downloadUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Document unavailable" }, { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();
    const filename = doc.storageKey.split("/").pop() ?? "document";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":        doc.mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control":       "private, no-store",
      },
    });
  } catch (err) {
    console.error("[kyc/documents] error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
