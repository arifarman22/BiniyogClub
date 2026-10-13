import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  Landmark,
  Layers,
  Network,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { GROUP_COVER } from "@/components/groups/group-detail";
import { TierIcon } from "@/components/groups/tier-icon";
import { EditGroupDialog } from "@/components/admin/edit-group-dialog";
import { EditEntityDialog } from "@/components/admin/edit-entity-dialog";
import { EditTierDialog, type BankOption } from "@/components/admin/edit-tier-dialog";
import { fmtBdt } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import type { getAllGroupsAdmin } from "@/server/data/groups.data";

type Group = Awaited<ReturnType<typeof getAllGroupsAdmin>>[number];

const TIER_LABEL: Record<string, string> = {
  INVESTOR: "Investor",
  SHAREHOLDER: "Shareholder",
  DIRECTORSHIP: "Directorship",
  PLOT_BOOKING: "Plot Booking",
  LAND_SHARE: "Land Sharing",
};

const th = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap";
const td = "px-4 py-3 align-middle";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        active ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground/60")} />
      {active ? "Active" : "Hidden"}
    </span>
  );
}

export function GroupStructureView({
  groups,
  bankOptions,
  canManage,
}: {
  groups: Group[];
  bankOptions: BankOption[];
  canManage: boolean;
}) {
  const entities = groups.flatMap((g) => g.entities);
  const tiers = entities.flatMap((e) => e.tiers);
  const activeTiers = tiers.filter((t) => t.isActive);
  const missingAccount = activeTiers.filter((t) => !t.bankAccount || !t.bankAccount.isActive);
  const investorCount = tiers.reduce((n, t) => n + t._count.investments, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="Business groups" value={groups.length} description={`${groups.filter((g) => g.isActive).length} active`} icon={<Network />} variant="brand" />
        <StatCard title="Entities" value={entities.length} description={`${entities.filter((e) => e.isActive).length} active`} icon={<Layers />} variant="finance" />
        <StatCard title="Investment tiers" value={tiers.length} description={`${activeTiers.length} live · ${plural(investorCount, "investment")}`} icon={<Users />} variant="default" />
        <StatCard
          title="Missing payment account"
          value={missingAccount.length}
          description={missingAccount.length ? "Active tiers investors can't invest in" : "All active tiers can take payments"}
          icon={<AlertTriangle />}
          variant="harvest"
        />
      </div>

      {!canManage && (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          You have read-only access. Editing requires the <span className="font-mono">group.manage</span> permission.
        </p>
      )}

      {/* Quick jump */}
      {groups.length > 1 && (
        <nav className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-muted-foreground">Jump to:</span>
          {groups.map((g) => (
            <a key={g.id} href={`#group-${g.id}`}
              className="rounded-full border border-border bg-card px-3 py-1 font-medium transition-colors hover:border-primary/40 hover:text-primary">
              {g.name}
            </a>
          ))}
        </nav>
      )}

      {groups.map((group) => {
        const groupTiers = group.entities.flatMap((e) => e.tiers);
        const groupMissing = groupTiers.filter((t) => t.isActive && (!t.bankAccount || !t.bankAccount.isActive)).length;
        const publicHref = `/groups/${group.slug.toLowerCase()}`;

        return (
          <div key={group.id} id={`group-${group.id}`} className="surface-card scroll-mt-24 overflow-hidden">
            {/* Group header */}
            <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/30 px-5 py-4">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png"} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{group.name}</h2>
                  <StatusPill active={group.isActive} />
                  {groupMissing > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                      <AlertTriangle className="h-3 w-3" /> {groupMissing} need payment account
                    </span>
                  )}
                </div>
                {group.tagline && <p className="mt-0.5 truncate text-xs text-muted-foreground">{group.tagline}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {group.entities.length} {group.entities.length === 1 ? "entity" : "entities"} · {groupTiers.length} tiers ·{" "}
                  {plural(groupTiers.reduce((n, t) => n + t._count.investments, 0), "investment")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={publicHref} target="_blank"
                  className="flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs transition-colors hover:bg-muted/40">
                  <ExternalLink className="h-3 w-3" /> View page
                </Link>
                {canManage && (
                  <>
                    <EditEntityDialog mode="create" groupId={group.id} />
                    <EditGroupDialog group={{
                      id: group.id,
                      name: group.name,
                      tagline: group.tagline ?? null,
                      description: group.description,
                      coverUrl: group.coverUrl ?? null,
                      logoUrl: group.logoUrl ?? null,
                      isActive: group.isActive,
                    }} />
                  </>
                )}
              </div>
            </div>

            {/* Entities */}
            {group.entities.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No entities yet{canManage ? " — use “Add Entity” to create one." : "."}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {group.entities.map((entity) => (
                  <section key={entity.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{entity.name}</h3>
                          <StatusPill active={entity.isActive} />
                          <Link href={`${publicHref}/${entity.slug}`} target="_blank"
                            className="font-mono text-[11px] text-muted-foreground hover:text-primary">
                            /{entity.slug}
                          </Link>
                        </div>
                        {entity.description && (
                          <p className="mt-0.5 line-clamp-1 max-w-3xl text-xs text-muted-foreground">{entity.description}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <EditTierDialog
                            mode="create"
                            entityId={entity.id}
                            nextSortOrder={entity.tiers.length ? Math.max(...entity.tiers.map((t) => t.sortOrder)) + 1 : 0}
                            bankAccounts={bankOptions}
                          />
                          <EditEntityDialog entity={{
                            id: entity.id,
                            name: entity.name,
                            description: entity.description,
                            isActive: entity.isActive,
                          }} />
                        </div>
                      )}
                    </div>

                    {entity.tiers.length === 0 ? (
                      <p className="border-t border-border/60 px-5 py-6 text-center text-xs text-muted-foreground">No tiers yet.</p>
                    ) : (
                      <div className="overflow-x-auto border-t border-border/60">
                        <table className="w-full min-w-[1040px] table-fixed text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className={cn(th, "w-12 pl-5")}>#</th>
                              <th className={cn(th, "w-[22%]")}>Tier</th>
                              <th className={cn(th, "w-32 text-right")}>Min / Max</th>
                              <th className={cn(th, "w-20 text-right")}>Return</th>
                              <th className={cn(th, "w-24 text-right")}>Duration</th>
                              <th className={cn(th, "w-28 text-right")}>Units left</th>
                              <th className={th}>Payment account</th>
                              <th className={cn(th, "w-28 text-right")}>Investments</th>
                              <th className={cn(th, "w-24")}>Status</th>
                              {canManage && <th className={cn(th, "w-24 pr-5 text-right")}>Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {entity.tiers.map((tier) => {
                              const bankOk = tier.bankAccount && tier.bankAccount.isActive;
                              return (
                                <tr key={tier.id} className={cn("transition-colors hover:bg-primary/[0.03]", !tier.isActive && "opacity-60")}>
                                  <td className={cn(td, "pl-5 font-mono text-xs text-muted-foreground")}>{tier.sortOrder}</td>
                                  <td className={td}>
                                    <div className="flex items-center gap-2.5">
                                      <TierIcon type={tier.type} />
                                      <div className="min-w-0">
                                        <p className="font-medium">{tier.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{TIER_LABEL[tier.type] ?? tier.type}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className={cn(td, "whitespace-nowrap text-right font-mono text-xs")}>
                                    <p className="font-medium">{fmtBdt(tier.minAmountBdt)}</p>
                                    <p className="text-muted-foreground">{tier.maxAmountBdt != null ? fmtBdt(tier.maxAmountBdt) : "No max"}</p>
                                  </td>
                                  <td className={cn(td, "text-right font-medium tabular-nums")}>
                                    {tier.expectedReturnPct != null ? `${Number(tier.expectedReturnPct)}%` : <span className="text-muted-foreground">—</span>}
                                  </td>
                                  <td className={cn(td, "whitespace-nowrap text-right tabular-nums")}>
                                    {tier.durationMonths ? `${tier.durationMonths} mo` : <span className="text-muted-foreground">—</span>}
                                  </td>
                                  <td className={cn(td, "whitespace-nowrap text-right tabular-nums")}>
                                    {tier.availableUnits != null ? (
                                      <span className={cn(tier.availableUnits === 0 && "font-medium text-destructive")}>
                                        {tier.availableUnits}{tier.totalUnits != null && <span className="text-muted-foreground"> / {tier.totalUnits}</span>}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">Unlimited</span>
                                    )}
                                  </td>
                                  <td className={td}>
                                    {bankOk ? (
                                      <div className="flex items-start gap-1.5" title={tier.bankAccount!.accountName}>
                                        <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                        <div className="min-w-0 text-xs">
                                          <p className="truncate font-medium">{tier.bankAccount!.bankName}</p>
                                          <p className="truncate font-mono text-muted-foreground">{tier.bankAccount!.accountNumber}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">
                                        <AlertTriangle className="h-3 w-3" />
                                        {tier.bankAccount ? "Account inactive" : "Not assigned"}
                                      </span>
                                    )}
                                  </td>
                                  <td className={cn(td, "text-right tabular-nums")}>{tier._count.investments}</td>
                                  <td className={td}><StatusPill active={tier.isActive} /></td>
                                  {canManage && (
                                    <td className={cn(td, "pr-5 text-right")}>
                                      <div className="flex justify-end">
                                        <EditTierDialog
                                          bankAccounts={bankOptions}
                                          tier={{
                                            id: tier.id,
                                            type: tier.type,
                                            name: tier.name,
                                            description: tier.description,
                                            benefits: tier.benefits,
                                            minAmountBdt: Number(tier.minAmountBdt),
                                            maxAmountBdt: tier.maxAmountBdt != null ? Number(tier.maxAmountBdt) : null,
                                            expectedReturnPct: tier.expectedReturnPct != null ? Number(tier.expectedReturnPct) : null,
                                            durationMonths: tier.durationMonths,
                                            plotSizeSqft: tier.plotSizeSqft != null ? Number(tier.plotSizeSqft) : null,
                                            pricePerSqftBdt: tier.pricePerSqftBdt != null ? Number(tier.pricePerSqftBdt) : null,
                                            totalUnits: tier.totalUnits,
                                            availableUnits: tier.availableUnits,
                                            sortOrder: tier.sortOrder,
                                            bankAccountId: tier.bankAccountId,
                                            isActive: tier.isActive,
                                          }}
                                        />
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
