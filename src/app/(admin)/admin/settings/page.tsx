import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/authz/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = { title: "Settings — Admin" };

const ROLES = [
  "SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER",
  "KYC_OFFICER", "FIELD_OFFICER", "SUPPORT", "INVESTOR", "FARMER",
] as const;

const PERMISSION_GROUPS = [
  { label: "Users", keys: ["USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE", "USER_SUSPEND", "USER_CHANGE_ROLE"] },
  { label: "Projects", keys: ["PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE", "PROJECT_SUBMIT", "PROJECT_APPROVE", "PROJECT_PUBLISH", "PROJECT_ARCHIVE"] },
  { label: "Investments", keys: ["INVESTMENT_VIEW", "INVESTMENT_CREATE", "INVESTMENT_APPROVE", "INVESTMENT_CANCEL"] },
  { label: "Payments", keys: ["PAYMENT_VIEW", "PAYMENT_VERIFY"] },
  { label: "Withdrawals", keys: ["WITHDRAWAL_VIEW", "WITHDRAWAL_REQUEST", "WITHDRAWAL_APPROVE"] },
  { label: "KYC", keys: ["KYC_VIEW", "KYC_SUBMIT", "KYC_REVIEW", "KYC_APPROVE"] },
  { label: "Farms", keys: ["FARM_VIEW", "FARM_CREATE", "FARM_UPDATE"] },
  { label: "Farmers", keys: ["FARMER_VIEW", "FARMER_CREATE", "FARMER_UPDATE"] },
  { label: "Field Visits", keys: ["FIELD_VISIT_VIEW", "FIELD_VISIT_SCHEDULE", "FIELD_VISIT_CONDUCT"] },
  { label: "System", keys: ["REPORT_VIEW", "AUDIT_VIEW"] },
] as const;

export default async function AdminSettingsPage() {
  const session = await requireSession();
  await requirePermission(session, PERMISSIONS.AUDIT_VIEW);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform configuration and role permissions" />

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 font-semibold">Role Permission Matrix</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Read-only view of compile-time role permissions. Runtime overrides can be managed via the database.
        </p>

        <div className="space-y-8">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground w-40">Permission</th>
                      {ROLES.map((role) => (
                        <th key={role} className="pb-2 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                          {role.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.keys.map((permKey) => {
                      const permValue = PERMISSIONS[permKey as keyof typeof PERMISSIONS];
                      return (
                        <tr key={permKey} className="hover:bg-muted/20">
                          <td className="py-2 pr-4 font-mono text-muted-foreground">{permValue}</td>
                          {ROLES.map((role) => {
                            const has = role === "SUPER_ADMIN" || ROLE_PERMISSIONS[role]?.includes(permValue);
                            return (
                              <td key={role} className="py-2 px-2 text-center">
                                {has ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
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
      </div>
    </div>
  );
}
