import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, WifiOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type ErrorVariant = "generic" | "network" | "forbidden" | "not-found";

interface ErrorStateProps {
  variant?: ErrorVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

const variants: Record<ErrorVariant, { icon: ReactNode; title: string; description: string }> = {
  generic: {
    icon: <AlertTriangle className="size-6" />,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
  network: {
    icon: <WifiOff className="size-6" />,
    title: "Connection failed",
    description: "Unable to reach the server. Check your internet connection.",
  },
  forbidden: {
    icon: <ShieldAlert className="size-6" />,
    title: "Access denied",
    description: "You don't have permission to view this content.",
  },
  "not-found": {
    icon: <AlertTriangle className="size-6" />,
    title: "Not found",
    description: "The resource you're looking for doesn't exist or has been removed.",
  },
};

export function ErrorState({
  variant = "generic",
  title,
  description,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  const v = variants[variant];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        {v.icon}
      </div>
      <p className="text-base font-semibold text-foreground">{title ?? v.title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description ?? v.description}</p>
      <div className="mt-4 flex items-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
