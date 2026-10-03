import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectBankAccountManager } from "@/components/admin/project-bank-account-manager";
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
        }}
      />

      {/* Bank accounts section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project Bank Accounts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Investors will see these details when making payments</p>
        </div>
        <ProjectBankAccountManager
          projectId={project.id}
          bankAccounts={project.bankAccounts ?? []}
        />
      </div>
    </div>
  );
}
