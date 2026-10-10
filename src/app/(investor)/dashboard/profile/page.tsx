"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2, XCircle,
  Camera, Trash2, Pencil, X, Check, Lock, Eye, EyeOff,
} from "lucide-react";
import { cn } from "cn";
import {
  updateAvatarAction,
  deleteAvatarAction,
  updateProfileAction,
  changePasswordAction,
} from "@/server/actions/auth.actions";
import { useRouter } from "next/navigation";

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

const INCOME_RANGES = ["Under ৳3L", "৳3L–৳6L", "৳6L–৳12L", "৳12L–৳25L", "৳25L–৳50L", "Above ৳50L"];
const EXPERIENCE_LEVELS = ["None", "Less than 1 year", "1–3 years", "3–5 years", "5+ years"];
const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive"];

// ── Shared field components ───────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || <span className="text-muted-foreground/50 italic">Not set</span>}</p>
    </div>
  );
}

function Input({ label, name, defaultValue, type = "text", required }: {
  label: string; name: string; defaultValue?: string | null; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
      />
    </div>
  );
}

function Select({ label, name, defaultValue, options }: {
  label: string; name: string; defaultValue?: string | null; options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
      >
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SaveBar({ saving, error, success, onCancel }: {
  saving: boolean; error: string | null; success: boolean; onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
      <div className="text-xs">
        {error && <span className="text-destructive">{error}</span>}
        {success && <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
          <X className="h-3 w-3" /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Check className="h-3 w-3" /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Avatar Editor ─────────────────────────────────────────────────────────────

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
      if (res.success) setAvatarUrl(res.data.avatarUrl);
      else setError(res.error);
    });
  }

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      const res = await deleteAvatarAction();
      if (res.success) setAvatarUrl(null);
      else setError(res.error);
    });
  }

  return (
    <div className="flex items-center gap-5">
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
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          aria-label="Change photo">
          <Camera className="h-5 w-5 text-white" />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">{user.name}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
            <Camera className="h-3 w-3" />{uploading ? "Uploading…" : "Change Photo"}
          </button>
          {avatarUrl && (
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
              <Trash2 className="h-3 w-3" />{deleting ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 2 MB</p>
      </div>
    </div>
  );
}

// ── Personal Info Section ─────────────────────────────────────────────────────

function PersonalInfoSection({ user, onSaved }: { user: ProfileData; onSaved: (patch: Partial<ProfileData>) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null); setSuccess(false);
    startSave(async () => {
      const res = await updateProfileAction({
        name: fd.get("name") as string,
        phone: fd.get("phone") as string,
      });
      if (res.success) {
        setSuccess(true);
        onSaved({ name: fd.get("name") as string, phone: (fd.get("phone") as string) || null });
        setTimeout(() => { setEditing(false); setSuccess(false); }, 800);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="surface-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Personal Information</h2>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>

      <AvatarEditor user={user} />

      <div className="border-t border-border pt-5">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Full Name" name="name" defaultValue={user.name} required />
              <Input label="Phone Number" name="phone" defaultValue={user.phone} type="tel" />
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-muted-foreground">{user.email} <span className="text-xs">(cannot be changed)</span></p>
            </div>
            <SaveBar saving={saving} error={error} success={success} onCancel={() => { setEditing(false); setError(null); }} />
          </form>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: <User className="h-4 w-4" />, label: "Full Name", value: user.name, verified: true },
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
        )}
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        Member since {new Date(user.createdAt).toLocaleDateString("en-BD", { month: "long", year: "numeric" })}
      </p>
    </div>
  );
}

// ── Investor Profile Section ──────────────────────────────────────────────────

function InvestorProfileSection({ user, onSaved }: {
  user: ProfileData;
  onSaved: (profile: ProfileData["investorProfile"]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const profile = user.investorProfile;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null); setSuccess(false);
    startSave(async () => {
      const res = await updateProfileAction({
        city: fd.get("city") as string,
        country: fd.get("country") as string,
        occupation: fd.get("occupation") as string,
        annualIncomeRange: fd.get("annualIncomeRange") as string,
        investmentExperience: fd.get("investmentExperience") as string,
        riskTolerance: fd.get("riskTolerance") as string,
        address: fd.get("address") as string,
      });
      if (res.success) {
        setSuccess(true);
        onSaved({
          city: (fd.get("city") as string) || null,
          country: (fd.get("country") as string) || "BD",
          occupation: (fd.get("occupation") as string) || null,
          annualIncomeRange: (fd.get("annualIncomeRange") as string) || null,
          investmentExperience: (fd.get("investmentExperience") as string) || null,
          riskTolerance: (fd.get("riskTolerance") as string) || null,
          address: (fd.get("address") as string) || null,
        });
        setTimeout(() => { setEditing(false); setSuccess(false); }, 800);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Investor Profile</h2>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
            <Pencil className="h-3 w-3" /> {profile ? "Edit" : "Set Up"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="City" name="city" defaultValue={profile?.city} />
            <Input label="Country" name="country" defaultValue={profile?.country ?? "BD"} />
            <Input label="Occupation" name="occupation" defaultValue={profile?.occupation} />
            <Select label="Annual Income Range" name="annualIncomeRange" defaultValue={profile?.annualIncomeRange} options={INCOME_RANGES} />
            <Select label="Investment Experience" name="investmentExperience" defaultValue={profile?.investmentExperience} options={EXPERIENCE_LEVELS} />
            <Select label="Risk Tolerance" name="riskTolerance" defaultValue={profile?.riskTolerance} options={RISK_LEVELS} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <textarea name="address" defaultValue={profile?.address ?? ""} rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all resize-none" />
          </div>
          <SaveBar saving={saving} error={error} success={success} onCancel={() => { setEditing(false); setError(null); }} />
        </form>
      ) : profile ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="City" value={profile.city} />
            <Field label="Country" value={profile.country} />
            <Field label="Occupation" value={profile.occupation} />
            <Field label="Annual Income Range" value={profile.annualIncomeRange} />
            <Field label="Investment Experience" value={profile.investmentExperience} />
            <Field label="Risk Tolerance" value={profile.riskTolerance} />
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
      ) : (
        <div className="surface-card border-dashed p-6 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Investor profile not set up yet.</p>
        </div>
      )}
    </div>
  );
}

// ── Change Password Section ───────────────────────────────────────────────────

function ChangePasswordSection() {
  const [editing, setEditing] = useState(false);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPw = fd.get("newPassword") as string;
    const confirm = fd.get("confirmPassword") as string;
    if (newPw !== confirm) { setError("Passwords do not match"); return; }
    setError(null); setSuccess(false);
    startSave(async () => {
      const res = await changePasswordAction({ currentPassword: fd.get("currentPassword") as string, newPassword: newPw, confirmPassword: confirm });
      if (res.success) {
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => { setEditing(false); setSuccess(false); }, 1000);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Change Password</h2>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
            <Pencil className="h-3 w-3" /> Change
          </button>
        )}
      </div>

      {!editing ? (
        <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Current Password<span className="text-destructive ml-0.5">*</span></label>
            <div className="relative">
              <input name="currentPassword" type={showCurrent ? "text" : "password"} required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-9 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all" />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">New Password<span className="text-destructive ml-0.5">*</span></label>
              <div className="relative">
                <input name="newPassword" type={showNew ? "text" : "password"} required minLength={8}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-9 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Confirm New Password<span className="text-destructive ml-0.5">*</span></label>
              <input name="confirmPassword" type="password" required minLength={8}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
          <SaveBar saving={saving} error={error} success={success} onCancel={() => { setEditing(false); setError(null); }} />
        </form>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and investor profile</p>
      </div>

      {/* Top row: Personal Info + KYC side by side */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PersonalInfoSection
            user={user}
            onSaved={(patch) => setUser(u => u ? { ...u, ...patch } : u)}
          />
        </div>

        <div className="space-y-6">
          {/* KYC status */}
          <div className="surface-card p-5">
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
            {!user.kyc ? (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">KYC not submitted. Complete verification to unlock investing.</p>
                <a href="/dashboard/kyc" className="mt-2 inline-block text-sm text-primary hover:underline">Start KYC →</a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {user.kyc.status === "VERIFIED"
                  ? "Your identity has been verified."
                  : "Visit the KYC page to check your verification status."}
                {" "}<a href="/dashboard/kyc" className="text-primary hover:underline">View KYC →</a>
              </p>
            )}
          </div>

          <ChangePasswordSection />
        </div>
      </div>

      {/* Full-width investor profile */}
      <InvestorProfileSection
        user={user}
        onSaved={(profile) => setUser(u => u ? { ...u, investorProfile: profile } : u)}
      />
    </div>
  );
}
