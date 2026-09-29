import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const admin = await db.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("No admin user found. Seed users first.");

  const acc = await db.bankAccount.upsert({
    where: { id: "bank-default-001" },
    create: {
      id: "bank-default-001",
      bankName: "Dutch-Bangla Bank Limited",
      accountName: "Biniyog Club Ltd.",
      accountNumber: "1234567890123",
      routingNumber: "090261234",
      branchName: "Gulshan Branch",
      instructions: "Please use your registered email as the payment reference.",
      isActive: true,
      createdBy: admin.id,
    },
    update: { isActive: true },
  });
  console.log("✓ Seeded bank account:", acc.id, "-", acc.bankName);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
