import { verifyEmailAction } from "@/server/actions/auth.actions";
import { AuthCard } from "@/components/auth/auth-card";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify Email" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Invalid link" description="This verification link is missing a token.">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-7 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            The link you followed is incomplete. Please check your email for the correct link.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  const result = await verifyEmailAction(token);

  if (!result.success) {
    return (
      <AuthCard title="Verification failed" description="We could not verify your email address.">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-7 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            {result.error} — the link may have expired or already been used.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/auth/resend-verification"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Resend verification email
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Email verified!" description="Your account is now active.">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-muted">
          <CheckCircle className="size-7 text-success" />
        </div>
        <p className="text-sm text-muted-foreground">
          Your email address has been verified. You can now sign in to your account.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in to your account
        </Link>
      </div>
    </AuthCard>
  );
}
