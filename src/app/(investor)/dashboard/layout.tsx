import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";
import { db } from "@/lib/db/prisma";

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

  const kyc = await db.kyc.findUnique({
    where: { userId: session.id },
    select: { status: true },
  }).catch(() => null);
  const kycStatus = kyc?.status ?? "NOT_STARTED";

  return (
    <DashboardShell initials={initials} name={session.name} email={session.email} kycStatus={kycStatus}>
      {children}
    </DashboardShell>
  );
}
