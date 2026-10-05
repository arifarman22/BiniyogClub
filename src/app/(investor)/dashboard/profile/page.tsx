"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2, XCircle, Camera, Trash2 } from "lucide-react";
import { cn } from "cn";
import { updateAvatarAction, deleteAvatarAction } from "@/server/actions/auth.actions";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  investorProfile: {
    city: string | null;
    country: string;
    occupation: string | null;
    annualIncomeRange: string | null;
    investmentExperience: string | null;
    riskTolerance: string | null;
    address: string | null;
  } | null;
  kyc: { status: string } | null;
}

const KYC_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED:           "bg-muted text-muted-foreground",
  SUBMITTED:             "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW:          "bg-blue-100 text-blue-700",
  VERIFIED:              "bg-green-100 text-green-700",
  REJECTED:              "bg-red-100 text-red-700",
  RESUBMISSION_REQUIRED: "bg-orange-100 text-orange-700",
};

function AvatarEditor({ user }: { user: ProfileData }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, startUpload] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("avatar", file);
    startUpload(async () => {
      const res = await updateAvatarAction(fd);
      if (res.success) {
        setAvatarUrl(res.data.avatarUrl);
      } else {
        setError(res.error);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      const res = await deleteAvatarAction();
      if (res.success) {
        setAvatarUrl(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle */}
      <div className="relative group">
        <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-border">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={user.name} width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
              {initials}
            </div>
          )}
        </div>
        {/* Camera overlay */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          aria-label="Change photo"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Actions */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">{user.name}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Camera className="h-3 w-3" />
            {uploading ? "Uploading…" : "Change Photo"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              {deleting ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 2 MB</p>
      </div>
    </div>
  );
}

// ── Page (client component wrapping server data fetch) ────────────────────────

import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileData | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setUser).catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) {
    return (
      <div className="space-y-4 max-w-2xl animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    );
  }

  const profile = user.investorProfile;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account and investor profile</p>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <AvatarEditor user={user} />

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
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                : <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Member since {new Date(user.createdAt).toLocaleDateString("en-BD", { month: "long", year: "numeric" })}
        </p>
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
              {user.kyc.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {!user.kyc && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">KYC not submitted. Complete verification to unlock investing.</p>
            <a href="/dashboard/kyc" className="mt-2 inline-block text-sm text-primary hover:underline">Start KYC →</a>
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
