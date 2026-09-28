import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  xs: "size-3 border",
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-r-transparent",
        spinnerSizes[size],
        className,
      )}
    />
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" className="text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <Spinner size="xs" />
      Loading
    </span>
  );
}
