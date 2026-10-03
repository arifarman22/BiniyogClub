import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { getSession } from "@/lib/auth/session";
import { cookies } from "next/headers";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const isLoggedIn = jar.has("bc_session");
  const session = isLoggedIn ? await getSession() : null;
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar session={session} />
      <main className="flex-1 pt-24 sm:pt-[100px]">{children}</main>
      <PublicFooter />
    </div>
  );
}
