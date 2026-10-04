import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import { getAdminProjectById, getManagersForSelect, getGroupsForSelect } from "@/server/data/admin.data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  return { title: project ? `Edit: ${project.title} — Admin` : "Project Not Found" };
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const [project, managers, groups] = await Promise.all([
    getAdminProjectById(id),
    getManagersForSelect(),
    getGroupsForSelect(),
  ]);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/admin/projects/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Project
        </Link>
        <h1 className="text-xl font-bold">Edit Project</h1>
      </div>

      <ProjectForm
        mode="edit"
        projectId={project.id}
        managers={managers}
        groups={groups}
        initialBankAccounts={project.bankAccounts ?? []}
        defaultValues={{
          title: project.title,
          category: project.category,
          description: project.description,
          location: project.location ?? "",
          managerId: project.managerId,
          groupId: project.groupId ?? null,
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
          status: project.status,
        }}
      />

    </div>
  );
}
