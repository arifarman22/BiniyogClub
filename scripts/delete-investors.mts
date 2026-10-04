import { db } from "../src/lib/db/prisma";

const investors = await db.user.findMany({
  where: { role: "INVESTOR" },
  select: {
    id: true,
    email: true,
    name: true,
    investorProfile: {
      select: { id: true, investments: { select: { id: true } } },
    },
  },
});

console.log("Investors found:", investors.length);
investors.forEach((i) => console.log(" -", i.email, "|", i.name));

if (investors.length === 0) {
  console.log("Nothing to delete.");
  process.exit(0);
}

for (const user of investors) {
  const investmentIds = user.investorProfile?.investments.map((i) => i.id) ?? [];

  // Delete investment child records
  if (investmentIds.length > 0) {
    await db.manualPaymentSubmission.deleteMany({ where: { investmentId: { in: investmentIds } } });
    await db.profitDistribution.deleteMany({ where: { investmentId: { in: investmentIds } } });
    await db.distributionLineItem.deleteMany({ where: { investmentId: { in: investmentIds } } });
    await db.gatewayPayment.deleteMany({ where: { investmentId: { in: investmentIds } } });
    await db.ledgerTransaction.deleteMany({ where: { investmentId: { in: investmentIds } } });
    await db.investment.deleteMany({ where: { id: { in: investmentIds } } });
  }

  // Delete group investment records referencing this user
  await db.groupInvestment.deleteMany({ where: { investorUserId: user.id } });

  // Delete payments linked to this user's wallet
  const wallet = await db.wallet.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (wallet) {
    await db.payment.deleteMany({ where: { walletId: wallet.id } });
  }

  // Hard delete user (cascades sessions, kyc, wallet, investorProfile, notifications)
  await db.user.delete({ where: { id: user.id } });
  console.log("Deleted:", user.email);
}

console.log("Done.");
