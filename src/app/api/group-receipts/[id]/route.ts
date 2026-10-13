import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { renderGroupReceipt } from "@/server/services/group-receipt.service";
import { AppError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { pdf, filename } = await renderGroupReceipt(session, id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[group-receipt]", error);
    return NextResponse.json({ error: "Could not generate receipt" }, { status: 500 });
  }
}
