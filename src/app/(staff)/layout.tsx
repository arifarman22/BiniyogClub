import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/authz";
import type { ReactNode } from "react";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!isStaff(session.role)) redirect("/unauthorized");
  return <>{children}</>;
}
