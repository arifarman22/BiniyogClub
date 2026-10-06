"use server";

import { projectService } from "@/server/services/project.service";
import { projectSchema, projectUpdateSchema, statusTransitionSchema } from "@/validations/project";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/types/prisma";
import type { ActionResult } from "./auth.actions";
import { v2 as cloudinary } from "cloudinary";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { requirePermission } from "@/lib/authz";

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

export async function uploadProjectCoverImageAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PROJECT_UPDATE);

    const file = formData.get("file");
    if (!(file instanceof File)) return { success: false, error: "No file provided" };

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return { success: false, error: "File must be JPEG, PNG, or WebP" };
    if (file.size > 3 * 1024 * 1024) return { success: false, error: "File must be smaller than 3 MB" };

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `projects/covers/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60)}`;

    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          resource_type: "image",
          type: "upload",
          overwrite: true,
          quality: "auto:good",
          fetch_format: "auto",
          transformation: [{ width: 1280, crop: "limit" }],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });

    return { success: true, data: { url } };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
    console.error("[uploadProjectCoverImage]", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function createProjectAction(
  formData: unknown,
  bankAccounts?: { accountName: string; accountNumber: string; bankName: string; branchName?: string | null; routingNumber?: string | null; swiftCode?: string | null; mobileNumber?: string | null; email?: string | null; branchAddress?: string | null }[],
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = projectSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const project = await projectService.create(session, parsed.data);
    if (bankAccounts && bankAccounts.length > 0) {
      const { db } = await import("@/lib/db/prisma");
      await db.projectBankAccount.createMany({
        data: bankAccounts.map((b) => ({ ...b, projectId: project.id, email: b.email || null })),
      });
    }
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
