"use server";

import { db } from "@/lib/db/prisma";
import { sendEmail, emailLayout, ctaButton } from "@/lib/email/mailer";
import { env } from "@/config/env";
import type { NotificationType } from "@/types/prisma";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function notifyUser(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, unknown>) {
  await db.notification.create({ data: { userId, type, title, body, data: data as never } });
}

async function notifyByRoles(roles: string[], type: NotificationType, title: string, body: string, data?: Record<string, unknown>) {
  const users = await db.user.findMany({
    where: { role: { in: roles as never }, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!users.length) return;
  await db.notification.createMany({
    data: users.map((u) => ({ userId: u.id, type, title, body, data: data as never ?? undefined })),
  });
}

async function emailByRoles(roles: string[], subject: string, html: string) {
  const users = await db.user.findMany({
    where: { role: { in: roles as never }, status: "ACTIVE", deletedAt: null },
    select: { email: true },
  });
  await Promise.allSettled(users.map((u) => sendEmail({ to: u.email, subject, html })));
}

// ─── Email templates ──────────────────────────────────────────────────────────

function tplInvestmentSubmitted(investorName: string, projectTitle: string, amount: number) {
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">New Investment Submitted</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      <strong>${esc(investorName)}</strong> has submitted a new investment of
      <strong>৳${amount.toLocaleString()}</strong> in <strong>${esc(projectTitle)}</strong>.
    </p>
    <p style="color:#374151;font-size:14px;margin:0 0 4px;">Please review and approve it from the admin panel.</p>
    ${ctaButton(`${APP_URL}/admin/investments`, "Review Investment")}
  `);
}

function tplInvestmentApproved(investorName: string, projectTitle: string, amount: number, receipt: string) {
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">Your Investment is Approved 🎉</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${esc(investorName)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Your investment of <strong>৳${amount.toLocaleString()}</strong> in
      <strong>${esc(projectTitle)}</strong> has been approved and is now active.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin:0 0 16px;">
      <p style="margin:0;font-size:13px;color:#374151;">Receipt: <strong style="font-family:monospace;">${esc(receipt)}</strong></p>
    </div>
    ${ctaButton(`${APP_URL}/dashboard/investments`, "View My Investments")}
  `);
}

function tplInvestmentCancelled(investorName: string, projectTitle: string, reason: string) {
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">Investment Cancelled</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${esc(investorName)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Your investment in <strong>${esc(projectTitle)}</strong> has been cancelled.
    </p>
    <p style="color:#374151;font-size:14px;margin:0 0 16px;">Reason: ${esc(reason)}</p>
    ${ctaButton(`${APP_URL}/dashboard/investments`, "View My Investments")}
  `);
}

function tplProjectLaunched(projectTitle: string, projectSlug: string, description: string) {
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">New Investment Opportunity 🌿</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      A new project is now open for investment on Biniyog Club:
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin:0 0 16px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827;">${esc(projectTitle)}</p>
      <p style="margin:0;font-size:14px;color:#374151;">${esc(description.slice(0, 200))}${description.length > 200 ? "…" : ""}</p>
    </div>
    ${ctaButton(`${APP_URL}/projects/${projectSlug}`, "View Project")}
  `);
}

function tplWithdrawalStatus(investorName: string, status: "APPROVED" | "REJECTED", amount: number, reason?: string) {
  const approved = status === "APPROVED";
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">
      Withdrawal ${approved ? "Approved ✅" : "Rejected"}
    </h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${esc(investorName)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Your withdrawal request of <strong>৳${amount.toLocaleString()}</strong> has been
      <strong>${approved ? "approved" : "rejected"}</strong>.
    </p>
    ${!approved && reason ? `<p style="color:#374151;font-size:14px;margin:0 0 16px;">Reason: ${esc(reason)}</p>` : ""}
    ${ctaButton(`${APP_URL}/dashboard/portfolio`, "View Portfolio")}
  `);
}

function tplKycStatus(investorName: string, status: "VERIFIED" | "REJECTED", note?: string) {
  const approved = status === "VERIFIED";
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">
      KYC ${approved ? "Verified ✅" : "Rejected"}
    </h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${esc(investorName)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Your KYC submission has been <strong>${approved ? "verified" : "rejected"}</strong>.
    </p>
    ${note ? `<p style="color:#374151;font-size:14px;margin:0 0 16px;">${esc(note)}</p>` : ""}
    ${approved
      ? ctaButton(`${APP_URL}/projects`, "Start Investing")
      : ctaButton(`${APP_URL}/dashboard/kyc`, "Resubmit KYC")}
  `);
}

function tplDistributionPosted(investorName: string, projectTitle: string, netAmount: number, batchId: string) {
  return emailLayout(`
    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">Profit Distribution Posted 💰</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${esc(investorName)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
      A profit distribution of <strong>৳${netAmount.toLocaleString()}</strong> from
      <strong>${esc(projectTitle)}</strong> has been posted to your wallet.
    </p>
    ${ctaButton(`${APP_URL}/dashboard/portfolio`, "View Portfolio")}
  `);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const notificationService = {

  /** New investment submitted → in-app notify SUPER_ADMIN + ADMIN + FINANCE_OFFICER + email SUPER_ADMIN + FINANCE_OFFICER */
  async onInvestmentCreated(investorName: string, projectTitle: string, projectId: string, amountBdt: number, investmentId: string) {
    const body = `${investorName} invested ৳${amountBdt.toLocaleString()} in "${projectTitle}"`;
    await notifyByRoles(
      ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"],
      "INVESTMENT_CONFIRMED",
      "New Investment Submitted",
      body,
      { investmentId, projectId },
    );
    await emailByRoles(
      ["SUPER_ADMIN", "FINANCE_OFFICER"],
      `New Investment: ৳${amountBdt.toLocaleString()} in ${projectTitle}`,
      tplInvestmentSubmitted(investorName, projectTitle, amountBdt),
    );
  },

  /** Investment approved by admin → in-app + email investor */
  async onInvestmentApproved(investorUserId: string, investorName: string, investorEmail: string, projectTitle: string, amountBdt: number, receiptNumber: string, investmentId: string) {
    await notifyUser(investorUserId, "INVESTMENT_CONFIRMED", "Investment Approved", `Your investment of ৳${amountBdt.toLocaleString()} in "${projectTitle}" has been approved. Receipt: ${receiptNumber}`, { investmentId, receiptNumber });
    await sendEmail({ to: investorEmail, subject: "Your Biniyog Club investment has been approved", html: tplInvestmentApproved(investorName, projectTitle, amountBdt, receiptNumber) });
  },

  /** Investment cancelled by admin → in-app + email investor */
  async onInvestmentCancelledByAdmin(investorUserId: string, investorName: string, investorEmail: string, projectTitle: string, reason: string, investmentId: string) {
    await notifyUser(investorUserId, "INVESTMENT_CONFIRMED", "Investment Cancelled", `Your investment in "${projectTitle}" has been cancelled. Reason: ${reason}`, { investmentId });
    await sendEmail({ to: investorEmail, subject: "Your Biniyog Club investment has been cancelled", html: tplInvestmentCancelled(investorName, projectTitle, reason) });
  },

  /** Project published (FUNDRAISING) → in-app + email all active investors */
  async onProjectPublished(projectTitle: string, projectSlug: string, projectId: string, description: string) {
    await notifyByRoles(["INVESTOR"], "PROJECT_APPROVED", `New Project: ${projectTitle}`, `A new investment opportunity is now open: "${projectTitle}". Invest now!`, { projectId, projectSlug });
    const investors = await db.user.findMany({ where: { role: "INVESTOR", status: "ACTIVE", deletedAt: null }, select: { email: true } });
    await Promise.allSettled(investors.map((u) => sendEmail({ to: u.email, subject: `New Investment Opportunity: ${projectTitle}`, html: tplProjectLaunched(projectTitle, projectSlug, description) })));
  },

  /** Withdrawal approved or rejected → in-app + email investor */
  async onWithdrawalStatusChanged(investorUserId: string, investorName: string, investorEmail: string, status: "APPROVED" | "REJECTED", amountBdt: number, withdrawalId: string, reason?: string) {
    const notifType: NotificationType = status === "APPROVED" ? "WITHDRAWAL_APPROVED" : "SYSTEM";
    await notifyUser(investorUserId, notifType, `Withdrawal ${status === "APPROVED" ? "Approved" : "Rejected"}`, `Your withdrawal of ৳${amountBdt.toLocaleString()} has been ${status.toLowerCase()}.${reason ? ` Reason: ${reason}` : ""}`, { withdrawalId });
    await sendEmail({ to: investorEmail, subject: `Your Biniyog Club withdrawal has been ${status.toLowerCase()}`, html: tplWithdrawalStatus(investorName, status, amountBdt, reason) });
  },

  /** KYC verified or rejected → in-app + email investor */
  async onKycStatusChanged(investorUserId: string, investorName: string, investorEmail: string, status: "VERIFIED" | "REJECTED", note?: string) {
    const notifType: NotificationType = status === "VERIFIED" ? "KYC_APPROVED" : "KYC_REJECTED";
    await notifyUser(investorUserId, notifType, `KYC ${status === "VERIFIED" ? "Verified" : "Rejected"}`, `Your KYC submission has been ${status.toLowerCase()}.${note ? ` Note: ${note}` : ""}`, { status });
    await sendEmail({ to: investorEmail, subject: `Your Biniyog Club KYC has been ${status.toLowerCase()}`, html: tplKycStatus(investorName, status, note) });
  },

  /** Distribution posted → in-app + email each investor in the batch */
  async onDistributionPosted(lines: { investorUserId: string; investorEmail: string; investorName: string; netAmountBdt: number; projectTitle: string; batchId: string }[]) {
    await Promise.allSettled(lines.map(async (l) => {
      await notifyUser(l.investorUserId, "DISTRIBUTION_POSTED", "Profit Distribution Posted", `৳${l.netAmountBdt.toLocaleString()} from "${l.projectTitle}" has been posted to your wallet.`, { batchId: l.batchId });
      await sendEmail({ to: l.investorEmail, subject: `Profit distribution from ${l.projectTitle}`, html: tplDistributionPosted(l.investorName, l.projectTitle, l.netAmountBdt, l.batchId) });
    }));
  },
};
