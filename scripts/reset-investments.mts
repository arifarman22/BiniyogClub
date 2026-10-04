import { db } from "../src/lib/db/prisma";

// Get all investment IDs
const investments = await db.investment.findMany({ select: { id: true } });
const investmentIds = investments.map((i) => i.id);

console.log("Investments found:", investmentIds.length);

if (investmentIds.length > 0) {
  await db.manualPaymentSubmission.deleteMany({ where: { investmentId: { in: investmentIds } } });
  console.log("Deleted manual payment submissions");

  await db.profitDistribution.deleteMany({ where: { investmentId: { in: investmentIds } } });
  console.log("Deleted profit distributions");

  await db.distributionLineItem.deleteMany({ where: { investmentId: { in: investmentIds } } });
  console.log("Deleted distribution line items");

  await db.gatewayPayment.deleteMany({ where: { investmentId: { in: investmentIds } } });
  console.log("Deleted gateway payments");

  await db.ledgerEntry.deleteMany({ where: { ledgerTransaction: { investmentId: { in: investmentIds } } } });
  console.log("Deleted ledger entries");

  await db.ledgerTransaction.deleteMany({ where: { investmentId: { in: investmentIds } } });
  console.log("Deleted ledger transactions");

  await db.investment.deleteMany({});
  console.log("Deleted all investments");
}

// Reset fundedAmountBdt to 0 on all projects
await db.project.updateMany({ data: { fundedAmountBdt: 0 } });
console.log("Reset fundedAmountBdt to 0 on all projects");

// Also delete all payments from investor wallets
const investorWallets = await db.wallet.findMany({
  where: { type: "INVESTOR" },
  select: { id: true },
});
if (investorWallets.length > 0) {
  const walletIds = investorWallets.map((w) => w.id);
  await db.payment.deleteMany({ where: { walletId: { in: walletIds } } });
  await db.wallet.updateMany({ where: { id: { in: walletIds } }, data: { cachedBalance: 0 } });
  console.log("Cleared investor wallet payments and balances");
}

// Reset escrow wallet balance
await db.wallet.updateMany({ where: { type: "PLATFORM_ESCROW" }, data: { cachedBalance: 0 } });
console.log("Reset escrow wallet balance");

console.log("Done.");
