import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TextProps {
  children: ReactNode;
  className?: string;
}

export function PageTitle({ children, className }: TextProps) {
  return (
    <h1 className={cn("text-2xl font-bold tracking-tight text-foreground sm:text-3xl", className)}>
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className }: TextProps) {
  return (
    <h2 className={cn("text-lg font-semibold tracking-tight text-foreground", className)}>
      {children}
    </h2>
  );
}

export function CardTitle({ children, className }: TextProps) {
  return (
    <h3 className={cn("text-base font-semibold text-foreground", className)}>{children}</h3>
  );
}

export function Label({ children, className }: TextProps) {
  return (
    <span className={cn("text-sm font-medium text-foreground", className)}>{children}</span>
  );
}

export function Muted({ children, className }: TextProps) {
  return (
    <span className={cn("text-sm text-muted-foreground", className)}>{children}</span>
  );
}

export function Caption({ children, className }: TextProps) {
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>{children}</span>
  );
}

export function Code({ children, className }: TextProps) {
  return (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
        className,
      )}
    >
      {children}
    </code>
  );
}
