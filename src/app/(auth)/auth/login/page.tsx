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
      image="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80"
      quote="Real projects, real returns. Every investment opportunity is admin-reviewed, KYC-gated, and backed by a signed digital contract."
      quoteAuthor="Biniyog Club"
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
