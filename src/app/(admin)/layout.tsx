import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/authz";
import { db } from "@/lib/db/prisma";
import { ROLE_PERMISSIONS } from "@/lib/authz/permissions";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";
import type { UserRole } from "@/types/prisma";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isStaff(session.role)) redirect("/unauthorized");

  // Fetch DB permissions for this role (fall back to static map)
  let userPermissions: string[];
  if (session.role === "SUPER_ADMIN") {
    userPermissions = ["*"]; // wildcard — has everything
  } else {
    const rows = await db.rolePermission.findMany({
      where: { role: session.role },
      select: { permission: { select: { key: true } } },
    });
    userPermissions = rows.length > 0
      ? rows.map((r) => r.permission.key)
      : (ROLE_PERMISSIONS[session.role as UserRole] as string[] ?? []);
  }

  const [pendingPayments, pendingKyc, pendingDeposits] = await Promise.all([
    db.manualPaymentSubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.kyc.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.payment.count({ where: { direction: "INBOUND", status: "PENDING" } }),
  ]);

  const initials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AdminShell
      name={session.name}
      role={session.role}
      initials={initials}
      userPermissions={userPermissions}
      badges={{ "/admin/payments/manual": pendingPayments, "/admin/kyc": pendingKyc, "/admin/deposits": pendingDeposits }}
    >
      {children}
    </AdminShell>
  );
}
