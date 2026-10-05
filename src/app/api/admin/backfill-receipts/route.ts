import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { documentService } from "@/server/services/document.service";

export async function POST() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (existing) { skipped++; continue; }

    try {
      await documentService.generateInvestmentReceipt(inv.id);
      generated++;
    } catch (e) {
      errors.push(`${inv.receiptNumber ?? inv.id}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ generated, skipped, errors });
}
