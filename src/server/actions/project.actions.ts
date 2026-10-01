"use server";

import { projectService } from "@/server/services/project.service";
import { projectSchema, projectUpdateSchema, statusTransitionSchema } from "@/validations/project";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/types/prisma";
import type { ActionResult } from "./auth.actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationError<T>(
  issues: { path: (string | number | symbol)[]; message: string }[],
): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path.join("."));
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    success: false,
    error: issues[0]?.message ?? "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors,
  };
}

function serviceError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
  console.error("[project action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createProjectAction(
  formData: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = projectSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const project = await projectService.create(session, parsed.data);
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true, data: { id: project.id, slug: project.slug } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function updateProjectAction(
  projectId: string,
  formData: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!projectId) return { success: false, error: "Project ID required" };

  const parsed = projectUpdateSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const project = await projectService.update(session, projectId, parsed.data);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/projects/${project.slug}`);
    return { success: true, data: { id: project.id, slug: project.slug } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function transitionProjectAction(
  projectId: string,
  to: ProjectStatus,
  reason?: string,
): Promise<ActionResult<void>> {
  const parsed = statusTransitionSchema.safeParse({ projectId, reason });
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await projectService.transition(session, projectId, to, reason);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function archiveProjectAction(projectId: string): Promise<ActionResult<void>> {
  if (!projectId) return { success: false, error: "Project ID required" };

  try {
    const session = await requireSession();
    await projectService.archive(session, projectId);
    revalidatePath("/admin/projects");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult<void>> {
  if (!projectId) return { success: false, error: "Project ID required" };

  try {
    const session = await requireSession();
    await projectService.delete(session, projectId);
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
