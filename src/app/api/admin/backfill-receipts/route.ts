import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { documentService } from "@/server/services/document.service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const investments = await db.investment.findMany({
    where: { status: { in: ["ACTIVE", "MATURED", "COMPLETED"] } },
    select: {
      id: true,
      receiptNumber: true,
      project: { select: { id: true } },
      investorProfile: { select: { user: { select: { id: true } } } },
    },
  });

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const inv of investments) {
    const existing = await db.document.findFirst({
      where: {
        entityType: "PROJECT",
        entityId: inv.project.id,
        category: "INVESTMENT_RECEIPT",
        ownerUserId: inv.investorProfile.user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing && !force) { skipped++; continue; }

    // Force mode: soft-delete the old document so generateInvestmentReceipt creates a fresh one
    if (existing && force) {
      await db.document.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    }

    try {
      await documentService.generateInvestmentReceipt(inv.id);
      generated++;
    } catch (e) {
      errors.push(`${inv.receiptNumber ?? inv.id}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ generated, skipped, errors });
}
