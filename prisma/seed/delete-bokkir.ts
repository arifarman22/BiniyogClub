import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const user = await db.user.findFirst({
    where: { name: { contains: "bokkir", mode: "insensitive" } },
    include: { investorProfile: true },
  });

  if (!user) {
    console.log("User not found.");
    return;
  }

  console.log(`User: ${user.name} (${user.email}) id=${user.id}`);
  const profileId = user.investorProfile?.id;

  const investments = profileId
    ? await db.investment.findMany({
        where: { investorProfileId: profileId },
        select: { id: true, projectId: true, amountBdt: true, status: true },
      })
    : [];

  const invIds = investments.map((i) => i.id);
  console.log("Investments:", investments);

  const ledgerTxIds = invIds.length
    ? (await db.ledgerTransaction.findMany({ where: { investmentId: { in: invIds } }, select: { id: true } })).map((t) => t.id)
    : [];

  const projectAmounts: Record<string, number> = {};
  for (const inv of investments) {
    if (["ACTIVE", "MATURED", "COMPLETED"].includes(inv.status)) {
      projectAmounts[inv.projectId] = (projectAmounts[inv.projectId] || 0) + Number(inv.amountBdt);
    }
  }

  const wallet = await db.wallet.findFirst({ where: { userId: user.id }, select: { id: true } });
  const walletLedgerTxIds = wallet
    ? (await db.ledgerTransaction.findMany({
        where: { entries: { some: { walletId: wallet.id } }, investmentId: null },
        select: { id: true },
      })).map((t) => t.id)
    : [];

  const allLedgerTxIds = [...new Set([...ledgerTxIds, ...walletLedgerTxIds])];

  // Sequential deletes (no transaction to avoid deadlocks)
  if (invIds.length) {
    await db.distributionLineItem.deleteMany({ where: { investmentId: { in: invIds } } });
    console.log("✓ distribution line items");
    await db.profitDistribution.deleteMany({ where: { investmentId: { in: invIds } } });
    console.log("✓ profit distributions");
  }
  if (allLedgerTxIds.length) {
    await db.ledgerEntry.deleteMany({ where: { ledgerTransactionId: { in: allLedgerTxIds } } });
    console.log("✓ ledger entries");
    await db.ledgerTransaction.deleteMany({ where: { id: { in: allLedgerTxIds } } });
    console.log("✓ ledger transactions");
  }
  if (invIds.length) {
    await db.manualPaymentSubmission.deleteMany({ where: { investmentId: { in: invIds } } });
    console.log("✓ manual payment submissions");
    await db.gatewayPayment.deleteMany({ where: { investmentId: { in: invIds } } });
    console.log("✓ gateway payments");
    await db.investmentContract.deleteMany({ where: { investmentId: { in: invIds } } });
    console.log("✓ investment contracts");
    await db.investment.deleteMany({ where: { id: { in: invIds } } });
    console.log("✓ investments");
  }

  // Update project funded amounts
  for (const [projectId, amount] of Object.entries(projectAmounts)) {
    const proj = await db.project.findUnique({ where: { id: projectId }, select: { fundedAmountBdt: true, title: true } });
    console.log(`Project "${proj?.title}" current fundedAmountBdt: ${proj?.fundedAmountBdt}`);
    await db.project.update({
      where: { id: projectId },
      data: { fundedAmountBdt: { decrement: amount } },
    });
    console.log(`✓ Project "${proj?.title}": decremented fundedAmountBdt by ৳${amount}`);
  }

  // Documents
  await db.documentAuditLog.deleteMany({ where: { document: { uploadedBy: user.id } } });
  await db.document.deleteMany({ where: { uploadedBy: user.id } });
  console.log("✓ documents");

  // Null out audit logs actor
  await db.auditLog.updateMany({ where: { actorId: user.id }, data: { actorId: null } });
  console.log("✓ audit logs nulled");

  // Clear wallet payments & withdrawals (RESTRICT FK prevents cascade)
  if (wallet) {
    await db.payment.deleteMany({ where: { walletId: wallet.id } });
    await db.withdrawal.deleteMany({ where: { walletId: wallet.id } });
    await db.walletSnapshot.deleteMany({ where: { walletId: wallet.id } });
    // ledger entries on wallet already deleted above; delete any remaining
    await db.ledgerEntry.deleteMany({ where: { walletId: wallet.id } });
    console.log("✓ wallet payments/withdrawals/snapshots");
  }

  // Delete user (cascades: sessions, tokens, kyc+docs, notifications, wallet, groupInvestments, investorProfile)
  await db.user.delete({ where: { id: user.id } });
  console.log(`✓ Deleted user "${user.name}"`);
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
