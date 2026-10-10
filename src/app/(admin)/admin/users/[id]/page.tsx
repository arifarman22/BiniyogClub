import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminUserById } from "@/server/data/admin.data";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserActionButtons } from "./user-action-buttons";
import { fmtDate, fmtDateTime } from "@/lib/admin/utils";
import { NotFoundError } from "@/lib/errors";
import {
  CheckCircle2, XCircle, Mail, Phone, Shield, User,
  Calendar, Clock, Hash, Briefcase, MapPin, FileText,
  Activity, ChevronLeft,
} from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "User Detail — Admin" };

function InfoRow({ icon: Icon, label, value, children }: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {children ?? <p className="text-sm font-medium mt-0.5">{value}</p>}
      </div>
    </div>
  );
}

const STATUS_VARIANT: Record<string, string> = {
  ACTIVE: "active", SUSPENDED: "rejected", DEACTIVATED: "default",
};

const KYC_VARIANT: Record<string, string> = {
  VERIFIED: "active", SUBMITTED: "pending", UNDER_REVIEW: "pending",
  REJECTED: "rejected", RESUBMISSION_REQUIRED: "pending", NOT_STARTED: "default",
};

export default async function AdminUserDetailPage({ params }: AsyncComponentProps) {
  const session = await requireSession();
  const { id } = await params!;
  const user = await getAdminUserById(session, id as string);
  if (!user) throw new NotFoundError("User");

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/users" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Users
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{user.name}</span>
      </div>

      {/* ── Hero card ── */}
      <div className="surface-card overflow-hidden">
        <div className="relative h-28 overflow-hidden bg-[#06140f]"><div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_100%_0%,rgba(16,185,129,0.35),transparent_60%)]" /><div className="absolute inset-0 fintech-grid-pattern opacity-30" /></div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-brand-600 text-white text-2xl font-bold shadow-md">
              {user.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-xl object-cover" />
                : initials}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={STATUS_VARIANT[user.status] as never ?? "default"}>{user.status}</StatusBadge>
              {user.deletedAt && <StatusBadge status="rejected">DELETED</StatusBadge>}
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              <Shield className="h-3 w-3" /> {user.role.replace(/_/g, " ")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              <Activity className="h-3 w-3" /> {user._count.sessions} sessions
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              <FileText className="h-3 w-3" /> {user._count.auditLogs} audit logs
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Account details */}
          <div className="surface-card p-6">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Account Details
            </h2>
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone ?? "—"} />
            <InfoRow icon={Shield} label="Role" value={user.role.replace(/_/g, " ")} />
            <InfoRow icon={CheckCircle2} label="Email Verified">
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.emailVerified
                  ? <><CheckCircle2 className="h-4 w-4 text-success" /><span className="text-sm font-medium text-success">Verified</span></>
                  : <><XCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">Not verified</span></>}
              </div>
            </InfoRow>
            <InfoRow icon={CheckCircle2} label="Phone Verified">
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.phoneVerified
                  ? <><CheckCircle2 className="h-4 w-4 text-success" /><span className="text-sm font-medium text-success">Verified</span></>
                  : <><XCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">Not verified</span></>}
              </div>
            </InfoRow>
            <InfoRow icon={Calendar} label="Joined" value={fmtDate(user.createdAt)} />
            <InfoRow icon={Clock} label="Last Updated" value={fmtDateTime(user.updatedAt)} />
            {user.deletedAt && <InfoRow icon={XCircle} label="Deleted At" value={fmtDateTime(user.deletedAt)} />}
          </div>

          {/* Investor profile */}
          {user.investorProfile && (
            <div className="surface-card p-6">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Investor Profile
              </h2>
              <InfoRow icon={Hash} label="Profile ID" value={user.investorProfile.id} />
              <InfoRow icon={Briefcase} label="Occupation" value={user.investorProfile.occupation ?? "—"} />
              <InfoRow icon={MapPin} label="Country" value={user.investorProfile.country ?? "—"} />
            </div>
          )}

        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">

          {/* KYC */}
          <div className="surface-card p-6">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> KYC
            </h2>
            {user.kyc ? (
              <>
                <div className="mb-4">
                  <StatusBadge status={KYC_VARIANT[user.kyc.status] as never ?? "default"}>
                    {user.kyc.status.replace(/_/g, " ")}
                  </StatusBadge>
                </div>
                <InfoRow icon={Calendar} label="Submitted" value={fmtDate(user.kyc.submittedAt) ?? "—"} />
                <InfoRow icon={CheckCircle2} label="Reviewed" value={fmtDate(user.kyc.reviewedAt) ?? "—"} />
                <div className="mt-4">
                  <Link
                    href={`/admin/kyc/${user.kyc.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View full KYC submission →
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No KYC submitted yet.</p>
            )}
          </div>

          {/* Actions */}
          {!user.deletedAt && (
            <div className="surface-card p-6">
              <h2 className="mb-4 font-semibold">Actions</h2>
              <UserActionButtons
                userId={user.id}
                userName={user.name}
                userStatus={user.status}
                isSuperAdmin={session.role === "SUPER_ADMIN"}
              />
            </div>
          )}

          {/* Quick links */}
          <div className="surface-card p-6">
            <h2 className="mb-3 font-semibold text-sm">Quick Links</h2>
            <div className="space-y-1">
              {[
                { href: `/admin/investments?search=${encodeURIComponent(user.email)}`, label: "View Investments" },
                { href: `/admin/payments?search=${encodeURIComponent(user.email)}`, label: "View Payments" },
                { href: `/admin/audit-logs?search=${encodeURIComponent(user.email)}`, label: "Audit Logs" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  {label}
                  <ChevronLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
