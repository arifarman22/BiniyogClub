export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorProfile } from "@/server/data/investor.data";
import { User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "cn";

export const metadata: Metadata = { title: "Profile — Dashboard" };

const KYC_STATUS_COLORS: Record<string, string> = {
  NOT_SUBMITTED: "bg-muted text-muted-foreground",
  PENDING:       "bg-warning-muted text-warning-foreground",
  UNDER_REVIEW:  "bg-info-muted text-info-foreground",
  APPROVED:      "bg-success-muted text-success",
  REJECTED:      "bg-destructive/10 text-destructive",
  EXPIRED:       "bg-warning-muted text-warning-foreground",
};

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await getInvestorProfile(session);
  const profile = user.investorProfile;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account and investor profile</p>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">Investor · Member since {new Date(user.createdAt).toLocaleDateString("en-BD", { month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-5">
          {[
            { icon: <Mail className="h-4 w-4" />, label: "Email", value: user.email, verified: user.emailVerified },
            { icon: <Phone className="h-4 w-4" />, label: "Phone", value: user.phone ?? "Not provided", verified: user.phoneVerified },
          ].map(({ icon, label, value, verified }) => (
            <div key={label} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
              <div className="mt-0.5 text-muted-foreground">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
              </div>
              {verified
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                : <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>

      {/* KYC status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">KYC Status</h2>
          </div>
          {user.kyc && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", KYC_STATUS_COLORS[user.kyc.status] ?? "bg-muted text-muted-foreground")}>
              {user.kyc.status.replace("_", " ")}
            </span>
          )}
        </div>
        {!user.kyc && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">KYC not submitted. Complete verification to unlock investing.</p>
            <a href="/dashboard/kyc" className="mt-2 inline-block text-sm text-primary hover:underline">
              Start KYC →
            </a>
          </div>
        )}
      </div>

      {/* Investor profile */}
      {profile && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Investor Profile</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "City", value: profile.city },
              { label: "Country", value: profile.country },
              { label: "Occupation", value: profile.occupation },
              { label: "Annual Income Range", value: profile.annualIncomeRange },
              { label: "Investment Experience", value: profile.investmentExperience },
              { label: "Risk Tolerance", value: profile.riskTolerance },
            ]
              .filter(({ value }) => value)
              .map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
          </div>
          {profile.address && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{profile.address}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!profile && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Investor profile not set up yet.</p>
        </div>
      )}
    </div>
  );
}
