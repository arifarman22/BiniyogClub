import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Join Bangladesh's leading investment platform"
      image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80"
      quote="Track every taka in real time. Our double-entry ledger ensures your funds are always accounted for."
      quoteAuthor="Biniyog Club"
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
