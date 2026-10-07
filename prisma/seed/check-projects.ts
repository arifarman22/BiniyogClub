import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
db.project.findMany({
  where: { deletedAt: null },
  select: { title: true, minInvestmentBdt: true, maxInvestmentBdt: true, fundingGoalBdt: true, fundedAmountBdt: true, status: true }
}).then(r => { console.log(JSON.stringify(r, null, 2)); db.$disconnect(); });
