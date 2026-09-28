import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeletons";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyTitle = "No results",
  emptyDescription = "Nothing to show here yet.",
  emptyAction,
  className,
  footer,
}: DataTableProps<T>) {
  if (isLoading) {
    return <SkeletonTable rows={5} cols={columns.length} />;
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={<Inbox className="size-5" />}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    size="sm"
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="transition-colors hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer && <div className="border-t bg-muted/30 px-4 py-3">{footer}</div>}
    </div>
  );
}
