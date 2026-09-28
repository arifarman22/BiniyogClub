import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="size-10 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-20" />
          ))}
        </div>
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8", md: "size-10", lg: "size-12" };
  return <Skeleton className={cn("rounded-full", sizes[size])} />;
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonTableRow,
  SkeletonAvatar,
};
