import { Sprout } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="size-4" />
          </span>
          Biniyog Club
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
