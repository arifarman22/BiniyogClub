/**
 * Backfill missing investment receipts for all ACTIVE/MATURED/COMPLETED
 * investments that have a receiptNumber but no receipt document yet.
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = new PrismaClient();

async function main() {
  // Find all investments that should have a receipt but don't
  const investments = await db.investment.findMany({
    where: {
      status: { in: ["ACTIVE", "MATURED", "COMPLETED"] },
      receiptNumber: { not: null },
    },
    select: {
      id: true,
      receiptNumber: true,
      investorProfile: { select: { user: { select: { id: true, name: true } } } },
      project: { select: { id: true, title: true } },
    },
  });

  console.log(`Found ${investments.length} investments with receipt numbers`);

  for (const inv of investments) {
    const userId = inv.investorProfile.user.id;
    const existing = await db.document.findFirst({
      where: {
        category: "INVESTMENT_RECEIPT",
        ownerUserId: userId,
        description: `Receipt #${inv.receiptNumber}`,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      console.log(`✅ ${inv.receiptNumber} (${inv.investorProfile.user.name}) — already exists`);
      continue;
    }

    console.log(`⏳ Generating receipt for ${inv.receiptNumber} (${inv.investorProfile.user.name} — ${inv.project.title})...`);
    try {
      const { documentService } = await import("../../src/server/services/document.service");
      const result = await documentService.generateInvestmentReceipt(inv.id);
      console.log(`✅ Generated: documentId=${result.documentId}`);
    } catch (err) {
      console.error(`❌ Failed for ${inv.receiptNumber}:`, err);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error).finally(() => db.$disconnect());
