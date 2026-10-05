/**
 * backfill-receipts.mts
 * Run: npx tsx scripts/backfill-receipts.mts
 *
 * Generates INVESTMENT_RECEIPT documents for all ACTIVE/MATURED/COMPLETED
 * investments that don't already have one.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

// ─── Inline PDF renderer (avoids TSX/JSX issues in script context) ────────────
// We call the compiled Next.js approach via a direct Prisma + Cloudinary write.

const db = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

async function uploadBuffer(buffer: Buffer, key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: key, resource_type: "raw", type: "authenticated", overwrite: true },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.public_id);
      },
    );
    stream.end(buffer);
  });
}

async function main() {
  // Dynamically import the PDF renderer (ESM + JSX)
  const { renderInvestmentCertificate } = await import("../src/lib/pdf/investment-certificate.js");

  const investments = await db.investment.findMany({
    where: { status: { in: ["ACTIVE", "MATURED", "COMPLETED"] } },
    select: {
      id: true,
      amountBdt: true,
      expectedReturnBdt: true,
      returnType: true,
      createdAt: true,
      activatedAt: true,
      receiptNumber: true,
      project: {
        select: {
          id: true, title: true,
          expectedReturnPct: true, durationDays: true,
          category: true, location: true,
        },
      },
      investorProfile: {
        select: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  console.log(`Found ${investments.length} confirmed investments to check.`);

  let generated = 0;
  let skipped = 0;

  for (const inv of investments) {
    const investorUserId = inv.investorProfile.user.id;

    // Check if receipt already exists
    const existing = await db.document.findFirst({
      where: {
        entityType: "PROJECT",
        entityId: inv.project.id,
        category: "INVESTMENT_RECEIPT",
        ownerUserId: investorUserId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      console.log(`  SKIP  ${inv.receiptNumber ?? inv.id} — receipt already exists`);
      skipped++;
      continue;
    }

    try {
      const pdfBuffer = await renderInvestmentCertificate({
        receiptNumber: inv.receiptNumber ?? inv.id,
        generatedAt:   new Date().toISOString(),
        investor: {
          name:  inv.investorProfile.user.name ?? "Investor",
          email: inv.investorProfile.user.email,
          phone: inv.investorProfile.user.phone,
        },
        project: {
          title:             inv.project.title,
          expectedReturnPct: Number(inv.project.expectedReturnPct),
          durationDays:      inv.project.durationDays,
          category:          inv.project.category ?? undefined,
          location:          inv.project.location,
        },
        investment: {
          amountBdt:         Number(inv.amountBdt),
          expectedReturnBdt: Number(inv.expectedReturnBdt),
          returnType:        inv.returnType,
          activatedAt:       (inv.activatedAt ?? inv.createdAt).toISOString(),
        },
      });

      const filename = `receipt_${inv.receiptNumber ?? inv.id}`;
      const storageKey = `documents/receipts/investment/${inv.project.id}/${filename}_${Date.now()}`;
      const key = await uploadBuffer(pdfBuffer, storageKey);

      await db.document.create({
        data: {
          uploadedBy:      investorUserId,
          entityType:      "PROJECT",
          entityId:        inv.project.id,
          category:        "INVESTMENT_RECEIPT",
          name:            `Investment Receipt — ${inv.project.title}`,
          description:     `Receipt #${inv.receiptNumber ?? inv.id}`,
          fileUrl:         key,
          storageKey:      key,
          mimeType:        "application/pdf",
          sizeBytes:       pdfBuffer.length,
          isPublic:        false,
          isFinalized:     true,
          templateVersion: "v1.0.0",
          generatedAt:     new Date(),
          ownerUserId:     investorUserId,
          allowedRoles:    ["INVESTOR", "ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER"],
        },
      });

      console.log(`  OK    ${inv.receiptNumber ?? inv.id} — ${inv.investorProfile.user.name}`);
      generated++;
    } catch (err) {
      console.error(`  FAIL  ${inv.receiptNumber ?? inv.id}:`, err);
    }
  }

  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
