import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Join Biniyog Club and start investing in agriculture"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
