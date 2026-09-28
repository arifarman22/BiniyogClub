import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: "Home", href: "/", icon: <Home className="size-3.5" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />}
              {isLast ? (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  className="flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
