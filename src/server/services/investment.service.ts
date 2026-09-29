/**
 * investment.service.ts
 *
 * Core investment engine. All financial calculations are server-side.
 * Client-submitted amounts are validated against project constraints.
 *
 * Race-condition protection: critical writes use serializable transactions
 * with a SELECT ... FOR UPDATE lock on the project row.
 *
 * Idempotency: every create request carries a client-generated idempotencyKey.
 * If the same key is submitted twice, the existing investment is returned.
 *
 * Overfunding protection: remaining capacity is checked inside the transaction
 * after acquiring the row lock, so concurrent requests cannot both succeed.
 */

import { db } from "@/lib/db/prisma";
import { investmentRepository } from "@/db/repositories/investment.repository";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { CreateInvestmentInput, ConfirmPaymentInput, CancelInvestmentInput } from "@/validations/investment";
import type { Prisma } from "@/types/prisma";

// ─── Receipt number generation ────────────────────────────────────────────────

function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BC-${ts}-${rand}`;
}

// ─── Expected return calculation ──────────────────────────────────────────────
// Never trust client-submitted return figures. Always recalculate from project.

function calculateExpectedReturn(amountBdt: number, expectedReturnPct: number): number {
  // Round to 2 decimal places to match Decimal(14,2) precision
  return Math.round(amountBdt * (Number(expectedReturnPct) / 100) * 100) / 100;
}

// ─── Internal: resolve investorProfileId from session ────────────────────────

async function resolveProfile(session: SessionUser): Promise<string> {
  const profile = await db.investorProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile) throw new ForbiddenError("Investor profile not found. Please complete your profile.");
  return profile.id;
}

// ─── Internal: assert investment belongs to session user ─────────────────────

async function assertOwnership(
  session: SessionUser,
  investorProfileId: string,
): Promise<void> {
  const profile = await db.investorProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile || profile.id !== investorProfileId) {
    throw new ForbiddenError("You do not have access to this investment");
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const investmentService = {
  /**
   * Step 1–7: Validate and create a PENDING investment.
   *
   * Checks (in order):
   *  1. Authentication (session required)
   *  2. KYC must be APPROVED
   *  3. Project must be FUNDRAISING
   *  4. Amount validated against project min/max
   *  5. Remaining capacity check (inside serializable tx with row lock)
   *  6. Duplicate active investment check
   *  7. Idempotency: return existing if same key already used
   */
  async create(session: SessionUser, input: CreateInvestmentInput) {
    // 1. Permission check
    await requirePermission(session, PERMISSIONS.INVESTMENT_CREATE);

    // 2. KYC check
    const kyc = await db.kyc.findUnique({
      where: { userId: session.id },
      select: { status: true },
    });
    if (!kyc || kyc.status !== "VERIFIED") {
      throw new ForbiddenError(
        "KYC verification required. Please complete and get your KYC approved before investing.",
      );
    }

    // 7. Idempotency: if this key was already used, return the existing investment
    const existing = await investmentRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      // Verify it belongs to this investor (prevents key-guessing attacks)
      await assertOwnership(session, existing.investorProfileId);
      return { investment: existing, idempotent: true };
    }

    const investorProfileId = await resolveProfile(session);

    // Run the rest inside a serializable transaction with a row lock on the project
    // to prevent race conditions and overfunding.
    const investment = await db.$transaction(
      async (tx) => {
        // 3. Lock the project row and check status + capacity
        // Raw query for SELECT FOR UPDATE — Prisma doesn't expose this natively
        const [project] = await tx.$queryRaw<
          Array<{
            id: string;
            status: string;
            funding_goal_bdt: string;
            funded_amount_bdt: string;
            min_investment_bdt: string;
            max_investment_bdt: string | null;
            expected_return_pct: string;
            return_type: string;
            funding_deadline: Date;
          }>
        >`
          SELECT
            id,
            status,
            funding_goal_bdt,
            funded_amount_bdt,
            min_investment_bdt,
            max_investment_bdt,
            expected_return_pct,
            return_type,
            funding_deadline
          FROM projects
          WHERE id = ${input.projectId}
          FOR UPDATE
        `;

        if (!project) throw new NotFoundError("Project");

        // 3. Project status check
        if (project.status !== "FUNDRAISING") {
          throw new ValidationError(
            `Project is not accepting investments (status: ${project.status})`,
          );
        }

        // Check funding deadline
        if (new Date(project.funding_deadline) < new Date()) {
          throw new ValidationError("Project funding deadline has passed");
        }

        const fundingGoal = Number(project.funding_goal_bdt);
        const fundedAmount = Number(project.funded_amount_bdt);
        const minInvestment = Number(project.min_investment_bdt);
        const maxInvestment = project.max_investment_bdt
          ? Number(project.max_investment_bdt)
          : null;

        // 4 & 5. Amount validation
        if (input.amountBdt < minInvestment) {
          throw new ValidationError(
            `Minimum investment is ৳${minInvestment.toLocaleString("en-BD")}`,
          );
        }
        if (maxInvestment !== null && input.amountBdt > maxInvestment) {
          throw new ValidationError(
            `Maximum investment is ৳${maxInvestment.toLocaleString("en-BD")}`,
          );
        }

        // 6. Remaining capacity check (overfunding protection)
        const remaining = fundingGoal - fundedAmount;
        if (remaining <= 0) {
          throw new ConflictError("Project is fully funded");
        }
        if (input.amountBdt > remaining) {
          throw new ValidationError(
            `Only ৳${remaining.toLocaleString("en-BD")} remaining in this project`,
          );
        }

        // 6b. Duplicate active investment check
        const duplicate = await tx.investment.findFirst({
          where: {
            investorProfileId,
            projectId: input.projectId,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
          },
          select: { id: true, status: true },
        });
        if (duplicate) {
          throw new ConflictError(
            "You already have an active investment in this project",
          );
        }

        // 7. Calculate expected return server-side
        const expectedReturnBdt = calculateExpectedReturn(
          input.amountBdt,
          Number(project.expected_return_pct),
        );

        // Create the investment record
        const inv = await tx.investment.create({
          data: {
            investorProfileId,
            projectId: input.projectId,
            amountBdt: input.amountBdt,
            expectedReturnBdt,
            returnType: project.return_type as Prisma.InvestmentCreateInput["returnType"],
            idempotencyKey: input.idempotencyKey,
            status: "PENDING",
          },
          select: {
            id: true,
            investorProfileId: true,
            projectId: true,
            status: true,
            amountBdt: true,
            expectedReturnBdt: true,
            returnType: true,
            idempotencyKey: true,
            createdAt: true,
          },
        });

        return inv;
      },
      { isolationLevel: "Serializable" },
    );

    return { investment, idempotent: false };
  },

  /**
   * Steps 8–9: Initiate payment and move to PAYMENT_PENDING.
   * Creates a Payment record and a ledger transaction.
   */
  async initiatePayment(
    session: SessionUser,
    investmentId: string,
    paymentMethod: string,
  ) {
    const inv = await investmentRepository.findById(investmentId);
    if (!inv) throw new NotFoundError("Investment");

    await assertOwnership(session, inv.investorProfileId);

    if (inv.status !== "PENDING") {
      throw new ValidationError(
        `Cannot initiate payment for investment in status: ${inv.status}`,
      );
    }

    return db.$transaction(async (tx) => {
      // Ensure investor has a wallet; create one if not
      let wallet = await tx.wallet.findUnique({
        where: { userId: session.id },
        select: { id: true, cachedBalance: true },
      });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: session.id,
            type: "INVESTOR",
            cachedBalance: 0,
            currency: "BDT",
          },
          select: { id: true, cachedBalance: true },
        });
      }

      const amountBdt = Number(inv.amountBdt);

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          walletId: wallet.id,
          direction: "INBOUND",
          method: paymentMethod as Prisma.PaymentCreateInput["method"],
          status: "PENDING",
          amountBdt,
          feeBdt: 0,
          netAmountBdt: amountBdt,
          description: `Investment in ${inv.project.title}`,
        },
        select: { id: true, status: true },
      });

      // Move investment to PAYMENT_PENDING
      const updated = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: "PAYMENT_PENDING",
          paymentPendingAt: new Date(),
        },
        select: { id: true, status: true, amountBdt: true },
      });

      return { investment: updated, payment };
    });
  },

  /**
   * Steps 9–13: Verify payment, activate investment, create ledger records,
   * generate receipt, and update project funded amount.
   *
   * This is the most critical step — runs in a serializable transaction.
   */
  async confirmPayment(session: SessionUser, input: ConfirmPaymentInput) {
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const inv = await investmentRepository.findById(input.investmentId);
    if (!inv) throw new NotFoundError("Investment");

    if (inv.status !== "PAYMENT_PENDING") {
      throw new ValidationError(
        `Investment is not awaiting payment confirmation (status: ${inv.status})`,
      );
    }

    return db.$transaction(
      async (tx) => {
        const now = new Date();
        const amountBdt = Number(inv.amountBdt);

        // Lock the project row
        const [project] = await tx.$queryRaw<
          Array<{ id: string; status: string; funding_goal_bdt: string; funded_amount_bdt: string }>
        >`
          SELECT id, status, funding_goal_bdt, funded_amount_bdt
          FROM projects
          WHERE id = ${inv.projectId}
          FOR UPDATE
        `;

        if (!project) throw new NotFoundError("Project");

        // Final overfunding check inside the lock
        const remaining = Number(project.funding_goal_bdt) - Number(project.funded_amount_bdt);
        if (amountBdt > remaining) {
          throw new ConflictError(
            "Project capacity exceeded. Investment cannot be confirmed.",
          );
        }

        // Get investor wallet
        const wallet = await tx.wallet.findUnique({
          where: { userId: inv.investorProfile.user.id },
          select: { id: true, cachedBalance: true },
        });
        if (!wallet) throw new NotFoundError("Investor wallet");

        // Get or create platform escrow wallet
        let escrowWallet = await tx.wallet.findFirst({
          where: { type: "PLATFORM_ESCROW" },
          select: { id: true, cachedBalance: true },
        });
        if (!escrowWallet) {
          // Find the platform user (SUPER_ADMIN) to attach the wallet to
          const platformUser = await tx.user.findFirst({
            where: { role: "SUPER_ADMIN" },
            select: { id: true },
          });
          if (!platformUser) throw new NotFoundError("Platform user for escrow wallet");
          escrowWallet = await tx.wallet.create({
            data: {
              userId: platformUser.id,
              type: "PLATFORM_ESCROW",
              cachedBalance: 0,
              currency: "BDT",
            },
            select: { id: true, cachedBalance: true },
          });
        }

        // Update payment record to COMPLETED
        await tx.payment.updateMany({
          where: {
            walletId: wallet.id,
            status: "PENDING",
            direction: "INBOUND",
            amountBdt: inv.amountBdt,
          },
          data: {
            status: "COMPLETED",
            externalReference: input.externalReference,
            gatewayResponse: input.gatewayResponse ?? null,
            processedAt: now,
          },
        });

        // ── Double-entry ledger ───────────────────────────────────────────────
        // Debit investor wallet, Credit platform escrow wallet

        const investorNewBalance = Number(wallet.cachedBalance) + amountBdt;
        const escrowNewBalance = Number(escrowWallet.cachedBalance) + amountBdt;

        const ledgerTx = await tx.ledgerTransaction.create({
          data: {
            type: "INVESTMENT_FUNDING",
            investmentId: inv.id,
            referenceId: inv.id,
            referenceType: "Investment",
            description: `Investment funding: ${inv.project.title}`,
            amountBdt,
            entries: {
              create: [
                {
                  walletId: wallet.id,
                  entryType: "DEBIT",
                  amountBdt,
                  balanceAfterBdt: investorNewBalance,
                },
                {
                  walletId: escrowWallet.id,
                  entryType: "CREDIT",
                  amountBdt,
                  balanceAfterBdt: escrowNewBalance,
                },
              ],
            },
          },
          select: { id: true },
        });

        // Update wallet cached balances
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { cachedBalance: investorNewBalance },
        });
        await tx.wallet.update({
          where: { id: escrowWallet.id },
          data: { cachedBalance: escrowNewBalance },
        });

        // Generate receipt number
        const receiptNumber = generateReceiptNumber();

        // Activate investment
        const activated = await tx.investment.update({
          where: { id: inv.id },
          data: {
            status: "ACTIVE",
            confirmedAt: now,
            activatedAt: now,
            receiptNumber,
          },
          select: {
            id: true,
            status: true,
            amountBdt: true,
            expectedReturnBdt: true,
            receiptNumber: true,
            activatedAt: true,
          },
        });

        // Increment project funded amount
        const updatedProject = await tx.project.update({
          where: { id: inv.projectId },
          data: { fundedAmountBdt: { increment: amountBdt } },
          select: {
            id: true,
            status: true,
            fundingGoalBdt: true,
            fundedAmountBdt: true,
          },
        });

        // Auto-transition project to FUNDED if goal reached
        if (
          Number(updatedProject.fundedAmountBdt) >= Number(updatedProject.fundingGoalBdt) &&
          updatedProject.status === "FUNDRAISING"
        ) {
          await tx.project.update({
            where: { id: inv.projectId },
            data: { status: "FUNDED" },
          });
        }

        // Create investment contract (DRAFT)
        await tx.investmentContract.create({
          data: {
            investmentId: inv.id,
            status: "DRAFT",
            templateVersion: "v1.0",
            terms: {
              amountBdt,
              expectedReturnBdt: Number(inv.expectedReturnBdt),
              returnType: inv.returnType,
              projectId: inv.projectId,
              projectTitle: inv.project.title,
              investorId: inv.investorProfile.user.id,
              activatedAt: now.toISOString(),
            },
          },
        });

        return { investment: activated, ledgerTransactionId: ledgerTx.id, receiptNumber };
      },
      { isolationLevel: "Serializable" },
    );
  },

  /**
   * Step 14: Notify investor after successful activation.
   * Separated from confirmPayment so notification failure doesn't roll back the transaction.
   */
  async notifyInvestor(userId: string, investmentId: string, receiptNumber: string) {
    await db.notification.create({
      data: {
        userId,
        type: "INVESTMENT_CONFIRMED",
        title: "Investment Confirmed",
        body: `Your investment has been confirmed. Receipt: ${receiptNumber}`,
        data: { investmentId, receiptNumber },
      },
    });
  },

  /**
   * Cancel an investment.
   * Investors can cancel PENDING or PAYMENT_PENDING investments.
   * Staff with INVESTMENT_CANCEL can cancel ACTIVE investments.
   */
  async cancel(session: SessionUser, input: CancelInvestmentInput) {
    const inv = await investmentRepository.findById(input.investmentId);
    if (!inv) throw new NotFoundError("Investment");

    const isOwner = inv.investorProfile.user.id === session.id;
    const isStaff = await db.rolePermission
      .findFirst({
        where: {
          role: session.role,
          permission: { key: PERMISSIONS.INVESTMENT_CANCEL },
        },
      })
      .then(Boolean);

    if (!isOwner && !isStaff) {
      throw new ForbiddenError("You do not have permission to cancel this investment");
    }

    const cancellableByOwner = ["PENDING", "PAYMENT_PENDING"];
    const cancellableByStaff = ["PENDING", "PAYMENT_PENDING", "ACTIVE"];

    const allowed = isStaff ? cancellableByStaff : cancellableByOwner;
    if (!allowed.includes(inv.status)) {
      throw new ValidationError(
        `Cannot cancel investment in status: ${inv.status}`,
      );
    }

    return db.$transaction(async (tx) => {
      const now = new Date();

      const cancelled = await tx.investment.update({
        where: { id: inv.id },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancellationReason: input.reason,
        },
        select: { id: true, status: true, amountBdt: true, projectId: true },
      });

      // If ACTIVE, reverse the funded amount on the project
      if (inv.status === "ACTIVE") {
        await tx.project.update({
          where: { id: inv.projectId },
          data: { fundedAmountBdt: { decrement: Number(inv.amountBdt) } },
        });

        // Create reversal ledger entry
        const wallet = await tx.wallet.findUnique({
          where: { userId: inv.investorProfile.user.id },
          select: { id: true, cachedBalance: true },
        });
        const escrowWallet = await tx.wallet.findFirst({
          where: { type: "PLATFORM_ESCROW" },
          select: { id: true, cachedBalance: true },
        });

        if (wallet && escrowWallet) {
          const amountBdt = Number(inv.amountBdt);
          const investorNewBalance = Number(wallet.cachedBalance) - amountBdt;
          const escrowNewBalance = Number(escrowWallet.cachedBalance) - amountBdt;

          await tx.ledgerTransaction.create({
            data: {
              type: "REFUND",
              investmentId: inv.id,
              referenceId: inv.id,
              referenceType: "Investment",
              description: `Investment cancellation refund: ${inv.project.title}`,
              amountBdt,
              entries: {
                create: [
                  {
                    walletId: wallet.id,
                    entryType: "CREDIT",
                    amountBdt,
                    balanceAfterBdt: investorNewBalance,
                  },
                  {
                    walletId: escrowWallet.id,
                    entryType: "DEBIT",
                    amountBdt,
                    balanceAfterBdt: escrowNewBalance,
                  },
                ],
              },
            },
          });

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { cachedBalance: investorNewBalance },
          });
          await tx.wallet.update({
            where: { id: escrowWallet.id },
            data: { cachedBalance: escrowNewBalance },
          });
        }
      }

      // Notify investor
      await tx.notification.create({
        data: {
          userId: inv.investorProfile.user.id,
          type: "INVESTMENT_CONFIRMED",
          title: "Investment Cancelled",
          body: `Your investment has been cancelled. Reason: ${input.reason}`,
          data: { investmentId: inv.id },
        },
      });

      return cancelled;
    });
  },

  /**
   * Mark an investment as MATURED (called when project reaches DISTRIBUTION stage).
   * Staff only.
   */
  async mature(session: SessionUser, investmentId: string, actualReturnBdt: number) {
    await requirePermission(session, PERMISSIONS.INVESTMENT_APPROVE);

    const inv = await investmentRepository.findById(investmentId);
    if (!inv) throw new NotFoundError("Investment");

    if (inv.status !== "ACTIVE") {
      throw new ValidationError(`Investment must be ACTIVE to mature (current: ${inv.status})`);
    }

    return investmentRepository.updateStatus(investmentId, "MATURED", {
      maturedAt: new Date(),
      actualReturnBdt,
    });
  },

  /**
   * Mark an investment as COMPLETED after profit distribution.
   * Staff only.
   */
  async complete(session: SessionUser, investmentId: string) {
    await requirePermission(session, PERMISSIONS.INVESTMENT_APPROVE);

    const inv = await investmentRepository.findById(investmentId);
    if (!inv) throw new NotFoundError("Investment");

    if (inv.status !== "MATURED") {
      throw new ValidationError(`Investment must be MATURED to complete (current: ${inv.status})`);
    }

    return investmentRepository.updateStatus(investmentId, "COMPLETED", {
      completedAt: new Date(),
    });
  },

  /**
   * Get a single investment, enforcing ownership or staff permission.
   */
  async getById(session: SessionUser, investmentId: string) {
    const inv = await investmentRepository.findById(investmentId);
    if (!inv) throw new NotFoundError("Investment");

    const isOwner = inv.investorProfile.user.id === session.id;
    if (!isOwner) {
      await requirePermission(session, PERMISSIONS.INVESTMENT_VIEW);
    }

    return inv;
  },
};
