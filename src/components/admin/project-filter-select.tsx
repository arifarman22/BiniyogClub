"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface ProjectFilterSelectProps {
  projects: { id: string; title: string }[];
}

export function ProjectFilterSelect({ projects }: ProjectFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get("project") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams(searchParams.toString());
    if (e.target.value) sp.set("project", e.target.value);
    else sp.delete("project");
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      className="h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
    >
      <option value="">All Projects</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.title}</option>
      ))}
    </select>
  );
}
