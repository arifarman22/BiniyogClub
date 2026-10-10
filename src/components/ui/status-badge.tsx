import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatusVariant =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "failed"
  | "funding"
  | "draft"
  | "review"
  | "cancelled"
  | "matured"
  | "confirmed"
  | "processing"
  | "refunded"
  | "default";

const variantStyles: Record<StatusVariant, string> = {
  active:     "bg-success-muted text-success border-success/20",
  approved:   "bg-success-muted text-success border-success/20",
  completed:  "bg-success-muted text-success border-success/20",
  matured:    "bg-success-muted text-success border-success/20",
  confirmed:  "bg-success-muted text-success border-success/20",
  funding:    "bg-info-muted text-info border-info/20",
  processing: "bg-info-muted text-info border-info/20",
  pending:    "bg-warning-muted text-warning-foreground border-warning/20",
  review:     "bg-warning-muted text-warning-foreground border-warning/20",
  draft:      "bg-muted text-muted-foreground border-border",
  inactive:   "bg-muted text-muted-foreground border-border",
  rejected:   "bg-destructive/10 text-destructive border-destructive/20",
  failed:     "bg-destructive/10 text-destructive border-destructive/20",
  cancelled:  "bg-destructive/10 text-destructive border-destructive/20",
  refunded:   "bg-muted text-muted-foreground border-border",
  default:    "bg-muted text-muted-foreground border-border",
};

interface StatusBadgeProps {
  status: StatusVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, children, className, dot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        variantStyles[status] ?? variantStyles.default,
        className,
      )}
    >
      {dot && (
        <span
          className={cn("size-1.5 rounded-full", {
            "bg-success":             ["active", "approved", "completed", "matured", "confirmed"].includes(status),
            "bg-info":                ["funding", "processing"].includes(status),
            "bg-warning":             ["pending", "review"].includes(status),
            "bg-muted-foreground":    ["draft", "inactive", "refunded", "default"].includes(status),
            "bg-destructive":         ["rejected", "failed", "cancelled"].includes(status),
          })}
        />
      )}
      {children}
    </span>
  );
}
