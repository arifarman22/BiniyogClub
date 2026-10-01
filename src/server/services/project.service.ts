import { db } from "@/lib/db/prisma";
import { projectRepository } from "@/db/repositories/project.repository";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import {
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { ProjectInput, ProjectUpdateInput } from "@/validations/project";
import type { ProjectStatus } from "@/types/prisma";

// ─── Valid lifecycle transitions ──────────────────────────────────────────────
// Maps current status → allowed next statuses

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT:            ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED:         ["FUNDRAISING", "CANCELLED"],
  FUNDRAISING:      ["FUNDED", "CANCELLED"],
  FUNDED:           ["ACTIVE", "CANCELLED"],
  ACTIVE:           ["COMPLETED", "CANCELLED"],
  COMPLETED:        [],
  CANCELLED:        [],
};

// ─── Who can trigger each transition ─────────────────────────────────────────

type TransitionPermission = {
  permission: string;
  ownerAllowed?: boolean; // farmer/owner can trigger without explicit permission
};

const TRANSITION_PERMISSIONS: Partial<Record<`${ProjectStatus}->${ProjectStatus}`, TransitionPermission>> = {
  "DRAFT->PENDING_APPROVAL":    { permission: PERMISSIONS.PROJECT_CREATE, ownerAllowed: true },
  "PENDING_APPROVAL->APPROVED": { permission: PERMISSIONS.PROJECT_APPROVE },
  "PENDING_APPROVAL->DRAFT":    { permission: PERMISSIONS.PROJECT_APPROVE },
  "APPROVED->FUNDRAISING":      { permission: PERMISSIONS.PROJECT_PUBLISH },
  "FUNDED->ACTIVE":             { permission: PERMISSIONS.PROJECT_UPDATE },
  "ACTIVE->COMPLETED":          { permission: PERMISSIONS.PROJECT_ARCHIVE },
};

// ─── Slug generation ──────────────────────────────────────────────────────────

async function generateSlug(title: string, excludeId?: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  let slug = base;
  let attempt = 0;

  while (await projectRepository.slugExists(slug, excludeId)) {
    attempt++;
    slug = `${base}-${attempt}`;
  }

  return slug;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const projectService = {
  // ── Create ──────────────────────────────────────────────────────────────────
  async create(session: SessionUser, input: ProjectInput) {
    await requirePermission(session, PERMISSIONS.PROJECT_CREATE);

    const slug = await generateSlug(input.title);

    return projectRepository.create({
      title: input.title,
      slug,
      description: input.description,
      category: input.category,
      location: input.location ?? "",
      riskInfo: input.riskInfo,
      fundingGoalBdt: input.fundingGoalBdt,
      fundingMinBdt: input.fundingMinBdt,
      minInvestmentBdt: input.minInvestmentBdt,
      maxInvestmentBdt: input.maxInvestmentBdt ?? null,
      returnType: input.returnType,
      expectedReturnPct: input.expectedReturnPct,
      durationDays: input.durationDays,
      fundingDeadline: input.fundingDeadline,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      imageUrls: input.imageUrls ?? [],
      manager: input.managerId ? { connect: { id: input.managerId } } : undefined,
    });
  },

  // ── Update ──────────────────────────────────────────────────────────────────
  async update(session: SessionUser, projectId: string, input: ProjectUpdateInput) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("Project");

    // All project updates require explicit PROJECT_UPDATE permission
    await requirePermission(session, PERMISSIONS.PROJECT_UPDATE);

    const slug = input.title && input.title !== project.title
      ? await generateSlug(input.title, projectId)
      : undefined;

    return projectRepository.update(projectId, {
      ...(input.title && { title: input.title }),
      ...(slug && { slug }),
      ...(input.description && { description: input.description }),
      ...(input.category && { category: input.category }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.riskInfo !== undefined && { riskInfo: input.riskInfo }),
      ...(input.fundingGoalBdt && { fundingGoalBdt: input.fundingGoalBdt }),
      ...(input.fundingMinBdt && { fundingMinBdt: input.fundingMinBdt }),
      ...(input.minInvestmentBdt && { minInvestmentBdt: input.minInvestmentBdt }),
      ...(input.maxInvestmentBdt !== undefined && { maxInvestmentBdt: input.maxInvestmentBdt }),
      ...(input.returnType && { returnType: input.returnType }),
      ...(input.expectedReturnPct && { expectedReturnPct: input.expectedReturnPct }),
      ...(input.durationDays && { durationDays: input.durationDays }),
      ...(input.fundingDeadline && { fundingDeadline: input.fundingDeadline }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl }),
      ...(input.imageUrls !== undefined && { imageUrls: input.imageUrls }),
      ...(input.managerId !== undefined && {
        manager: input.managerId ? { connect: { id: input.managerId } } : { disconnect: true },
      }),
    });
  },

  // ── Transition ───────────────────────────────────────────────────────────────
  async transition(
    session: SessionUser,
    projectId: string,
    to: ProjectStatus,
    reason?: string,
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("Project");

    const from = project.status;
    const allowed = TRANSITIONS[from];

    if (!allowed.includes(to)) {
      throw new ValidationError(`Cannot transition from ${from} to ${to}`);
    }

    const key = `${from}->${to}` as `${ProjectStatus}->${ProjectStatus}`;
    const perm = TRANSITION_PERMISSIONS[key];

    if (perm) {
      await requirePermission(session, perm.permission as never);
    } else {
      // Default: require PROJECT_UPDATE
      await requirePermission(session, PERMISSIONS.PROJECT_UPDATE);
    }

    const now = new Date();
    const statusData: Record<string, unknown> = { status: to };

    if (to === "PENDING_APPROVAL") statusData.reviewedAt = null;
    if (to === "APPROVED") { statusData.approvedAt = now; statusData.reviewedBy = session.id; statusData.reviewedAt = now; statusData.rejectionReason = null; }
    if (to === "FUNDRAISING") statusData.publishedAt = now;
    if (to === "COMPLETED") statusData.completedAt = now;
    if (to === "CANCELLED") { statusData.cancelledAt = now; statusData.cancellationReason = reason ?? null; }
    if (to === "DRAFT" && from === "PENDING_APPROVAL") {
      // Rejection — send back to draft with reason
      statusData.rejectionReason = reason ?? null;
    }

    return projectRepository.update(projectId, statusData);
  },

  // ── Soft delete / archive ────────────────────────────────────────────────────
  async archive(session: SessionUser, projectId: string) {
    await requirePermission(session, PERMISSIONS.PROJECT_ARCHIVE);
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("Project");

    if (!["COMPLETED", "CANCELLED"].includes(project.status)) {
      throw new ValidationError("Only COMPLETED or CANCELLED projects can be archived");
    }

    return projectRepository.update(projectId, { deletedAt: new Date() });
  },

  // ── Admin force delete (soft) ────────────────────────────────────────────────
  async delete(session: SessionUser, projectId: string) {
    await requirePermission(session, PERMISSIONS.PROJECT_DELETE);
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("Project");
    return projectRepository.update(projectId, { deletedAt: new Date() });
  },

  // ── Get single (with auth) ───────────────────────────────────────────────────
  async getById(session: SessionUser | null, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("Project");

    // Public can only see FUNDRAISING+ (non-draft, non-pending)
    const publicStatuses: ProjectStatus[] = [
      "FUNDRAISING", "FUNDED", "ACTIVE", "COMPLETED",
    ];

    if (!publicStatuses.includes(project.status)) {
      if (!session) throw new NotFoundError("Project");
      await requirePermission(session, PERMISSIONS.PROJECT_VIEW);
    }

    return project;
  },
};
