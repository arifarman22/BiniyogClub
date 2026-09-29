import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/authz";
import { AuthCard } from "@/components/auth/auth-card";
import { StaffLoginForm } from "@/components/auth/staff-login-form";

export const metadata: Metadata = { title: "Staff Login — Biniyog Club" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && isStaff(session.role)) redirect("/admin");

  return (
    <AuthCard
      title="Staff Portal"
      description="Sign in with your staff credentials"
    >
      <StaffLoginForm />
    </AuthCard>
  );
}
