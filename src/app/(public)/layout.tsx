import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { getSession } from "@/lib/auth/session";
import { getGroupsWithProjects } from "@/server/data/public.data";
import { formatReturnPct } from "@/lib/financial/return-range";
import { SEGMENTS, type EcosystemSegment } from "@/lib/ecosystem";
import { cookies } from "next/headers";

/** The six ecosystem segments with their live projects, for the navbar mega menu. */
async function getEcosystem(): Promise<EcosystemSegment[]> {
  // Cached (5 min) — the same query the homepage hierarchy uses.
  const groups = await getGroupsWithProjects().catch(() => []);
  const bySlug = new Map(groups.map((g) => [g.slug as string, g]));

  return SEGMENTS.map((s) => {
    const group = s.groupSlug ? bySlug.get(s.groupSlug) : undefined;
    return {
      key: s.key,
      name: group?.name ?? s.name,
      desc: s.desc,
      href: group ? `/groups/${group.slug.toLowerCase()}` : null,
      projects: (group?.projects ?? []).map((p) => ({
        slug: p.slug,
        title: p.title,
        status: p.status,
        minInvestmentBdt: Number(p.minInvestmentBdt),
        returnLabel: p.expectedReturnPct != null ? formatReturnPct(p) : null,
        coverImageUrl: p.coverImageUrl ?? null,
      })),
    };
  });
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const isLoggedIn = jar.has("bc_session");
  const [session, ecosystem] = await Promise.all([
    isLoggedIn ? getSession() : null,
    getEcosystem(),
  ]);
  return (
    <div className="theme-premium flex min-h-screen flex-col overflow-x-clip">
      <PublicNavbar session={session} ecosystem={ecosystem} />
      <main className="flex-1 pt-24 sm:pt-[100px]">{children}</main>
      <PublicFooter />
    </div>
  );
}
