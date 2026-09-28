import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="text-5xl mb-4">🔒</p>
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-6">
        You don&apos;t have permission to view this page.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
        <Link
          href="/auth/login"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Sign in with a different account
        </Link>
      </div>
    </div>
  );
}
