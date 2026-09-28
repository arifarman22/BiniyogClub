import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(amount: number, currency = "BDT"): string {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(date));
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  return {
    items: items.slice(offset, offset + limit),
    total,
    page,
    limit,
    totalPages,
  };
}
