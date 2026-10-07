import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const user = await db.user.findFirst({
    where: { name: { contains: "arif", mode: "insensitive" } },
    select: {
      id: true, name: true, email: true,
      investorProfile: {
        select: {
          id: true,
          investments: {
            select: {
              id: true, status: true, amountBdt: true,
              receiptNumber: true, activatedAt: true, createdAt: true,
              project: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  console.log("=== USER ===");
  console.log(JSON.stringify(user, null, 2));

  if (user?.id) {
    const docs = await db.document.findMany({
      where: { category: "INVESTMENT_RECEIPT", ownerUserId: user.id },
      select: { id: true, description: true, entityId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    console.log("\n=== RECEIPT DOCUMENTS ===");
    console.log(JSON.stringify(docs, null, 2));
  }
}

main().catch(console.error).finally(() => db.$disconnect());
