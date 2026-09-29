import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/authz";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isStaff(session.role)) redirect("/unauthorized");

  const initials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AdminShell name={session.name} role={session.role} initials={initials}>
      {children}
    </AdminShell>
  );
}
