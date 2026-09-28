import type { UserRole } from "@/types/prisma";

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export interface RouteContext {
  params: Promise<Record<string, string>>;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type PropsWithClassName<T = object> = T & { className?: string };

export type AsyncComponentProps<T = object> = T & {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};
