import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?callbackUrl=/dashboard");
  if (session.role !== "INVESTOR") redirect("/unauthorized");

  const initials = session.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <DashboardShell initials={initials} name={session.name} email={session.email}>
      {children}
    </DashboardShell>
  );
}
