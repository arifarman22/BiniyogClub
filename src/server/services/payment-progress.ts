/**
 * Split (multi-method) manual payments.
 *
 * An investment can be paid in several parts — e.g. part bank transfer, part
 * cheque, part cash. Each part is one ManualPaymentSubmission carrying its own
 * method, amount, reference and proof, and finance reviews each part on its
 * own. The investment activates once approved parts cover its full amount;
 * a rejected part simply leaves that amount outstanding to be paid again.
 */

import { db } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export { PAYMENT_METHODS, MAX_PAYMENT_PARTS, toPaisa } from "@/lib/payments/split-payment";
import { toPaisa } from "@/lib/payments/split-payment";

const PENDING = ["SUBMITTED", "UNDER_REVIEW"];

type Client = Prisma.TransactionClient | typeof db;

export async function getPaymentProgress(investmentId: string, client: Client = db) {
  // Sequential on purpose: this also runs inside interactive transactions.
  const investment = await client.investment.findUnique({ where: { id: investmentId }, select: { amountBdt: true } });
  const parts = await client.manualPaymentSubmission.findMany({
    where: { investmentId },
    select: {
      id: true, status: true, amountBdt: true, paymentMethod: true, transactionRef: true,
      bankAccountId: true, cashReceivedBy: true, batchId: true, rejectionReason: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const total = Number(investment?.amountBdt ?? 0);
  const sum = (statuses: string[]) =>
    parts.filter((p) => statuses.includes(p.status)).reduce((s, p) => s + Number(p.amountBdt), 0);

  const approved = sum(["APPROVED"]);
  const pending = sum(PENDING);
  const outstanding = Math.max(0, (toPaisa(total) - toPaisa(approved) - toPaisa(pending)) / 100);

  return {
    total,
    approved,
    pending,
    outstanding,
    isFullyApproved: toPaisa(approved) >= toPaisa(total) && total > 0,
    parts: parts.map((p) => ({ ...p, amountBdt: Number(p.amountBdt) })),
  };
}

export type PaymentProgress = Awaited<ReturnType<typeof getPaymentProgress>>;

