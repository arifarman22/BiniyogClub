import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import { getManagersForSelect } from "@/server/data/admin.data";

export const metadata: Metadata = { title: "New Project — Admin" };

export default async function NewProjectPage() {
  const managers = await getManagersForSelect();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <h1 className="text-xl font-bold">Create New Project</h1>
        <p className="text-sm text-muted-foreground">New projects start in DRAFT status.</p>
      </div>
      <ProjectForm mode="create" managers={managers} />
    </div>
  );
}
