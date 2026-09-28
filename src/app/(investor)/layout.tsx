import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { ReactNode } from "react";

export default async function InvestorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?callbackUrl=/dashboard");
  if (session.role !== "INVESTOR") redirect("/unauthorized");
  return <>{children}</>;
}
