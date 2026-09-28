import { vi } from "vitest";

// Mock Next.js server-only APIs not available in test environment
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}));

// Suppress console.error in tests unless explicitly needed
vi.spyOn(console, "error").mockImplementation(() => {});
