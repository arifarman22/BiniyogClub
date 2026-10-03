import type { ReactNode } from "react";

export default function StaffAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {children}
    </div>
  );
}
