"use client";

import { useState, useTransition } from "react";
import { updateRolePermissionsAction } from "@/server/actions/permission.actions";
import { PERMISSIONS, PERMISSION_DESCRIPTIONS } from "@/lib/authz/permissions";
import { CheckCircle2, Save, Loader2 } from "lucide-react";

const ROLES = [
  "SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER",
  "KYC_OFFICER", "SUPPORT", "INVESTOR",
] as const;

type Role = typeof ROLES[number];

const PERMISSION_GROUPS = [
  { label: "Users",         keys: ["USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE", "USER_SUSPEND", "USER_CHANGE_ROLE"] },
  { label: "Projects",      keys: ["PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE", "PROJECT_APPROVE", "PROJECT_PUBLISH", "PROJECT_ARCHIVE"] },
  { label: "Investments",   keys: ["INVESTMENT_VIEW", "INVESTMENT_CREATE", "INVESTMENT_APPROVE", "INVESTMENT_CANCEL"] },
  { label: "Payments",      keys: ["PAYMENT_VIEW", "PAYMENT_VERIFY"] },
  { label: "Withdrawals",   keys: ["WITHDRAWAL_VIEW", "WITHDRAWAL_REQUEST", "WITHDRAWAL_APPROVE"] },
  { label: "KYC",           keys: ["KYC_VIEW", "KYC_SUBMIT", "KYC_REVIEW", "KYC_APPROVE"] },
  { label: "Distributions", keys: ["DISTRIBUTION_VIEW", "DISTRIBUTION_CREATE", "DISTRIBUTION_APPROVE", "DISTRIBUTION_POST", "DISTRIBUTION_VOID"] },
  { label: "Documents",     keys: ["DOCUMENT_VIEW", "DOCUMENT_UPLOAD", "DOCUMENT_DOWNLOAD", "DOCUMENT_DELETE", "DOCUMENT_MANAGE"] },
  { label: "System",        keys: ["REPORT_VIEW", "AUDIT_VIEW"] },
] as const;

type Props = {
  initialPermissions: Record<string, string[]>;
  currentRole: string;
};

export function PermissionMatrix({ initialPermissions, currentRole }: Props) {
  // Map role → Set of permission keys
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    for (const role of ROLES) {
      m[role] = new Set(initialPermissions[role] ?? []);
    }
    return m;
  });

  const [saving, setSaving] = useState<Role | null>(null);
  const [saved, setSaved] = useState<Role | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function toggle(role: Role, permKey: string) {
    if (role === "SUPER_ADMIN") return; // always all
    const permValue = PERMISSIONS[permKey as keyof typeof PERMISSIONS];
    setMatrix((prev) => {
      const next = new Set(prev[role]);
      if (next.has(permValue)) next.delete(permValue);
      else next.add(permValue);
      return { ...prev, [role]: next };
    });
    setSaved(null);
  }

  function toggleAll(role: Role, permKeys: readonly string[], checked: boolean) {
    if (role === "SUPER_ADMIN") return;
    setMatrix((prev) => {
      const next = new Set(prev[role]);
      for (const k of permKeys) {
        const v = PERMISSIONS[k as keyof typeof PERMISSIONS];
        if (checked) next.add(v);
        else next.delete(v);
      }
      return { ...prev, [role]: next };
    });
    setSaved(null);
  }

  function saveRole(role: Role) {
    if (role === "SUPER_ADMIN") return;
    setSaving(role);
    setErrors((e) => ({ ...e, [role]: "" }));
    startTransition(async () => {
      const result = await updateRolePermissionsAction(
        role as never,
        Array.from(matrix[role]),
      );
      setSaving(null);
      if (result.success) {
        setSaved(role);
        setTimeout(() => setSaved(null), 2000);
      } else {
        setErrors((e) => ({ ...e, [role]: result.error ?? "Failed" }));
      }
    });
  }

  const canEdit = currentRole === "SUPER_ADMIN" || currentRole === "ADMIN";

  return (
    <div className="space-y-10">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-2.5 pl-4 pr-3 text-left font-medium text-muted-foreground w-52">Permission</th>
                  {ROLES.map((role) => (
                    <th key={role} className="py-2.5 px-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span>{role.replace(/_/g, " ")}</span>
                        {canEdit && role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => saveRole(role)}
                            disabled={saving === role || isPending}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                          >
                            {saving === role ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : saved === role ? (
                              <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                            ) : (
                              <Save className="h-2.5 w-2.5" />
                            )}
                            {saved === role ? "Saved" : "Save"}
                          </button>
                        )}
                        {errors[role] && (
                          <span className="text-[10px] text-destructive">{errors[role]}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Select-all row */}
                {canEdit && (
                  <tr className="border-b border-border bg-muted/10">
                    <td className="py-1.5 pl-4 pr-3 text-[10px] text-muted-foreground italic">Toggle all</td>
                    {ROLES.map((role) => {
                      if (role === "SUPER_ADMIN") return <td key={role} className="py-1.5 px-3 text-center text-[10px] text-muted-foreground">—</td>;
                      const allChecked = group.keys.every((k) =>
                        matrix[role].has(PERMISSIONS[k as keyof typeof PERMISSIONS])
                      );
                      return (
                        <td key={role} className="py-1.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={(e) => toggleAll(role, group.keys, e.target.checked)}
                            className="h-3 w-3 cursor-pointer accent-primary"
                          />
                        </td>
                      );
                    })}
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-border">
                {group.keys.map((permKey) => {
                  const permValue = PERMISSIONS[permKey as keyof typeof PERMISSIONS];
                  const desc = PERMISSION_DESCRIPTIONS[permValue];
                  return (
                    <tr key={permKey} className="hover:bg-muted/20">
                      <td className="py-2 pl-4 pr-3">
                        <span className="font-mono text-muted-foreground">{permValue}</span>
                        {desc && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{desc}</p>}
                      </td>
                      {ROLES.map((role) => {
                        const has = role === "SUPER_ADMIN" || matrix[role].has(permValue);
                        return (
                          <td key={role} className="py-2 px-3 text-center">
                            {role === "SUPER_ADMIN" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" />
                            ) : canEdit ? (
                              <input
                                type="checkbox"
                                checked={has}
                                onChange={() => toggle(role, permKey)}
                                className="h-3.5 w-3.5 cursor-pointer accent-primary"
                              />
                            ) : has ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" />
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
