import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { documentService } from "@/server/services/document.service";
import { AppError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Document ID required" }, { status: 400 });
  }

  try {
    const url = await documentService.getSignedDownloadUrl(session, id);
    // Redirect to the signed URL — browser handles the download
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
