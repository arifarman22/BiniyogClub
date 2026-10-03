import { cn } from "cn";

// Maps DB ProjectStatus → display state
export type DisplayState = "active" | "running" | "completed" | "inactive";

export function getDisplayState(status: string): DisplayState {
  switch (status) {
    case "FUNDRAISING":
      return "active";
    case "FUNDED":
    case "ACTIVE":
      return "running";
    case "COMPLETED":
      return "completed";
    default:
      // DRAFT, PENDING_APPROVAL, APPROVED, CANCELLED
      return "inactive";
  }
}

const STATE_CONFIG: Record<DisplayState, {
  label: string;
  dot: string;
  badge: string;
  blink: boolean;
}> = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    blink: false,
  },
  running: {
    label: "Running",
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    blink: false,
  },
  completed: {
    label: "Completed",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    blink: false,
  },
  inactive: {
    label: "Inactive",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    blink: true,
  },
};

export function ProjectStatusBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const state = getDisplayState(status);
  const config = STATE_CONFIG[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        config.badge,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          config.dot,
          config.blink && "animate-pulse",
        )}
      />
      {config.label}
    </span>
  );
}
