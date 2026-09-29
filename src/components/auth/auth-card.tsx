import Image from "next/image";
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
          <Image
            src="/Biniyog Club Logo Icon PNG.png"
            alt="Biniyog Club"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
          Biniyog<span className="text-primary ml-1">Club</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
