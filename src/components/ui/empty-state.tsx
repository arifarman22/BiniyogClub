import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: { wrapper: "py-8",  icon: "size-10", title: "text-sm", desc: "text-xs" },
  md: { wrapper: "py-12", icon: "size-12", title: "text-base", desc: "text-sm" },
  lg: { wrapper: "py-16", icon: "size-16", title: "text-lg", desc: "text-base" },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const s = sizeStyles[size];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.wrapper,
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-muted text-muted-foreground",
            s.icon,
          )}
        >
          {icon}
        </div>
      )}
      <p className={cn("font-semibold text-foreground", s.title)}>{title}</p>
      {description && (
        <p className={cn("mt-1 max-w-sm text-muted-foreground", s.desc)}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
