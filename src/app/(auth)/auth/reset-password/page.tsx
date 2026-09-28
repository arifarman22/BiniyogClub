import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { XCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reset Password" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Invalid link" description="This password reset link is missing a token.">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-7 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Please request a new password reset link.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Choose a strong password for your account"
      footer={
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
