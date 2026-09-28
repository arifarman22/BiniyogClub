import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import { getAdminProjectById, getFarmsForSelect, getManagersForSelect } from "@/server/data/admin.data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  return { title: project ? `Edit: ${project.title} — Admin` : "Project Not Found" };
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const [project, farms, managers] = await Promise.all([
    getAdminProjectById(id),
    getFarmsForSelect(),
    getManagersForSelect(),
  ]);

  if (!project) notFound();

  // Only allow editing in mutable statuses
  const editableStatuses = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "FUNDRAISING"];
  const isEditable = editableStatuses.includes(project.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/admin/projects/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Project
        </Link>
        <h1 className="text-xl font-bold">Edit Project</h1>
        {!isEditable && (
          <p className="mt-1 text-sm text-warning-foreground bg-warning-muted rounded-lg px-3 py-2">
            This project is in <strong>{project.status}</strong> status. Only staff with project update permission can edit it.
          </p>
        )}
      </div>

      <ProjectForm
        mode="edit"
        projectId={project.id}
        farms={farms}
        managers={managers}
        defaultValues={{
          title: project.title,
          category: project.category,
          description: project.description,
          location: project.location ?? "",
          farmId: project.farmId,
          managerId: project.managerId,
          fundingGoalBdt: Number(project.fundingGoalBdt),
          fundingMinBdt: Number(project.fundingMinBdt),
          minInvestmentBdt: Number(project.minInvestmentBdt),
          maxInvestmentBdt: project.maxInvestmentBdt ? Number(project.maxInvestmentBdt) : null,
          returnType: project.returnType,
          expectedReturnPct: Number(project.expectedReturnPct),
          durationDays: project.durationDays,
          fundingDeadline: project.fundingDeadline.toISOString().split("T")[0],
          startDate: project.startDate ? project.startDate.toISOString().split("T")[0] : null,
          endDate: project.endDate ? project.endDate.toISOString().split("T")[0] : null,
          riskInfo: project.riskInfo,
          coverImageUrl: project.coverImageUrl,
        }}
      />
    </div>
  );
}
