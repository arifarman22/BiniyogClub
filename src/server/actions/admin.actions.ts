"use server";

import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { requireSession } from "@/lib/auth/session";
import { AppError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";

function svcErr<T>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return { success: false, error: e.message, code: e.code };
  console.error("[admin action]", e);
  return { success: false, error: "An unexpected error occurred." };
}

async function auditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
) {
  await db.auditLog.create({
    data: {
      actorId,
      action: action as never,
      entityType,
      entityId,
      before: before as never ?? undefined,
      after: after as never ?? undefined,
    },
  });
}

// ─── User management ──────────────────────────────────────────────────────────

export async function suspendUserAction(userId: string, reason?: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.USER_SUSPEND);

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, status: true, role: true } });
    if (!user) throw new NotFoundError("User");
    if (user.role === "SUPER_ADMIN") throw new ForbiddenError("Cannot suspend a super admin");

    await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
    await auditLog(session.id, "SUSPEND", "User", userId, { status: user.status }, { status: "SUSPENDED", reason });

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function activateUserAction(userId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.USER_SUSPEND);

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!user) throw new NotFoundError("User");

    await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    await auditLog(session.id, "ACTIVATE", "User", userId, { status: user.status }, { status: "ACTIVE" });

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function changeUserRoleAction(userId: string, role: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.USER_CHANGE_ROLE);

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) throw new NotFoundError("User");
    if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Only super admins can assign the SUPER_ADMIN role");
    }

    await db.user.update({ where: { id: userId }, data: { role: role as never } });
    await auditLog(session.id, "UPDATE", "User", userId, { role: user.role }, { role });

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function deleteUserAction(userId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.USER_DELETE);

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) throw new NotFoundError("User");
    if (user.role === "SUPER_ADMIN") throw new ForbiddenError("Cannot delete a super admin");

    await db.user.update({ where: { id: userId }, data: { deletedAt: new Date(), status: "DEACTIVATED" } });
    await auditLog(session.id, "DELETE", "User", userId);

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

// ─── Project management ───────────────────────────────────────────────────────

export async function approveProjectAction(projectId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PROJECT_APPROVE);

    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, status: true } });
    if (!project) throw new NotFoundError("Project");
    if (project.status !== "PENDING_APPROVAL") throw new ValidationError("Project must be PENDING_APPROVAL to approve");

    await db.project.update({
      where: { id: projectId },
      data: { status: "APPROVED", approvedAt: new Date(), reviewedBy: session.id, reviewedAt: new Date() },
    });
    await auditLog(session.id, "APPROVE", "Project", projectId, { status: project.status }, { status: "APPROVED" });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function rejectProjectAction(projectId: string, reason: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PROJECT_APPROVE);

    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, status: true } });
    if (!project) throw new NotFoundError("Project");

    await db.project.update({
      where: { id: projectId },
      data: { status: "DRAFT", rejectionReason: reason, reviewedBy: session.id, reviewedAt: new Date() },
    });
    await auditLog(session.id, "REJECT", "Project", projectId, { status: project.status }, { status: "DRAFT", reason });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function publishProjectAction(projectId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PROJECT_PUBLISH);

    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, status: true } });
    if (!project) throw new NotFoundError("Project");
    if (project.status !== "APPROVED") throw new ValidationError("Project must be APPROVED to publish");

    await db.project.update({
      where: { id: projectId },
      data: { status: "FUNDRAISING", publishedAt: new Date() },
    });
    await auditLog(session.id, "UPDATE", "Project", projectId, { status: project.status }, { status: "FUNDRAISING" });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

// ─── Withdrawal management ────────────────────────────────────────────────────

export async function approveWithdrawalAction(withdrawalId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_APPROVE);

    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, select: { id: true, status: true } });
    if (!w) throw new NotFoundError("Withdrawal");
    if (w.status !== "PENDING") throw new ValidationError("Withdrawal must be PENDING to approve");

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.id },
    });
    await auditLog(session.id, "APPROVE", "Withdrawal", withdrawalId, { status: w.status }, { status: "APPROVED" });

    revalidatePath("/admin/withdrawals");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function rejectWithdrawalAction(withdrawalId: string, reason: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_APPROVE);

    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, select: { id: true, status: true } });
    if (!w) throw new NotFoundError("Withdrawal");
    if (!["PENDING", "APPROVED"].includes(w.status)) throw new ValidationError("Cannot reject in current status");

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason },
    });
    await auditLog(session.id, "REJECT", "Withdrawal", withdrawalId, { status: w.status }, { status: "REJECTED", reason });

    revalidatePath("/admin/withdrawals");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function completeWithdrawalAction(withdrawalId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.WITHDRAWAL_APPROVE);

    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, select: { id: true, status: true } });
    if (!w) throw new NotFoundError("Withdrawal");
    if (w.status !== "APPROVED") throw new ValidationError("Withdrawal must be APPROVED to complete");

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "COMPLETED", completedAt: new Date(), processedAt: new Date() },
    });
    await auditLog(session.id, "UPDATE", "Withdrawal", withdrawalId, { status: w.status }, { status: "COMPLETED" });

    revalidatePath("/admin/withdrawals");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

// ─── Investment management ────────────────────────────────────────────────────

export async function cancelInvestmentAdminAction(investmentId: string, reason: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.INVESTMENT_CANCEL);

    const inv = await db.investment.findUnique({ where: { id: investmentId }, select: { id: true, status: true } });
    if (!inv) throw new NotFoundError("Investment");
    if (!["PENDING", "PAYMENT_PENDING", "ACTIVE"].includes(inv.status)) {
      throw new ValidationError(`Cannot cancel investment in status: ${inv.status}`);
    }

    await db.investment.update({
      where: { id: investmentId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason },
    });
    await auditLog(session.id, "UPDATE", "Investment", investmentId, { status: inv.status }, { status: "CANCELLED", reason });

    revalidatePath("/admin/investments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

// ─── Notification broadcast ───────────────────────────────────────────────────

export async function sendNotificationAction(data: {
  userIds: string[];
  type: string;
  title: string;
  body: string;
}): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.USER_VIEW);

    if (!data.title?.trim() || !data.body?.trim()) {
      return { success: false, error: "Title and body are required" };
    }
    if (!data.userIds?.length) {
      return { success: false, error: "Select at least one recipient" };
    }

    const result = await db.notification.createMany({
      data: data.userIds.map((userId) => ({
        userId,
        type: data.type as never,
        title: data.title,
        body: data.body,
      })),
    });

    await auditLog(session.id, "CREATE", "Notification", "bulk", undefined, { count: result.count, type: data.type });

    revalidatePath("/admin/notifications");
    return { success: true, data: { count: result.count } };
  } catch (e) { return svcErr(e); }
}

