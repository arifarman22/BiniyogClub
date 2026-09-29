import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Biniyog Club account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
