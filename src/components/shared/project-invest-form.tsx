"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createInvestmentAction } from "@/server/actions/investment.actions";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { getReturnRange, formatReturnPct } from "@/lib/financial/return-range";

type Project = {
  id: string;
  title: string;
  minInvestmentBdt: number;
  maxInvestmentBdt?: number;
  expectedReturnPct: number;
  returnPctMin?: number | null;
  returnPctMax?: number | null;
  returnType: string;
  durationDays: number;
};

type Step = "cta" | "form" | "done";

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID: "Hybrid",
};

function ProjectInvestFormInner({
  project,
  isLoggedIn,
  kycApproved,
  currentPath,
}: {
  project: Project;
  isLoggedIn: boolean;
  kycApproved: boolean;
  currentPath: string;
  walletBalance?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("cta");
  const [amount, setAmount] = useState(project.minInvestmentBdt.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(`${currentPath}?invest=${project.id}`)}`;

  useEffect(() => {
    if (isLoggedIn && searchParams.get("invest") === project.id) {
      setStep("form");
      const url = new URL(window.location.href);
      url.searchParams.delete("invest");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isLoggedIn, searchParams, project.id]);

  const amtNum = Number(amount) || 0;
  const range = getReturnRange(project);
  const taka = (pct: number) => Math.round((amtNum * pct) / 100).toLocaleString("en-BD");
  const expectedReturnLabel = range
    ? `+৳${taka(range.min)} – ৳${taka(range.max)}`
    : `+৳${taka(project.expectedReturnPct)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createInvestmentAction({
      projectId: project.id,
      amountBdt: amtNum,
    });
    setLoading(false);
    if (result.success) {
      router.push(`/dashboard/investments/${result.data.investmentId}/pay`);
    } else {
      setError(result.error ?? "Failed to create investment");
    }
  }

  if (step === "cta") {
    if (!isLoggedIn) {
      return (
        <div className="space-y-2">
          <a href={loginUrl} className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
            Login to Invest
          </a>
          <a href={`/auth/register?callbackUrl=${encodeURIComponent(`${currentPath}?invest=${project.id}`)}`}
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium hover:bg-muted/40 transition-colors">
            Create Account
          </a>
        </div>
      );
    }
    if (!kycApproved) {
      return (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-warning">KYC Verification Required</p>
          <p className="text-xs text-muted-foreground">Complete your KYC to unlock investing.</p>
          <a href="/dashboard/kyc" className="block w-full rounded-lg bg-warning/90 px-3 py-2 text-center text-xs font-medium text-white hover:bg-warning transition-colors">
            Complete KYC →
          </a>
        </div>
      );
    }
    return (
      <button onClick={() => setStep("form")} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
        Invest Now →
      </button>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
        <p className="font-semibold text-sm text-success">Investment Created!</p>
        <button onClick={() => router.push("/dashboard/investments")}
          className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80">
          Go to My Investments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Investment Amount (BDT) <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          min={project.minInvestmentBdt}
          max={project.maxInvestmentBdt}
          className="w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Min: ৳{project.minInvestmentBdt.toLocaleString("en-BD")}
          {project.maxInvestmentBdt ? ` · Max: ৳${project.maxInvestmentBdt.toLocaleString("en-BD")}` : ""}
        </p>
      </div>

      <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expected return ({formatReturnPct(project)})</span>
          <span className="text-right font-semibold text-success">{expectedReturnLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Return type</span>
          <span className="font-medium">{RETURN_TYPE_LABELS[project.returnType] ?? project.returnType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{project.durationDays} days</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5 shrink-0" />
        Bank transfer / Mobile banking
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <button type="button" onClick={() => setStep("cta")} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60">
          {loading ? "Processing…" : "Continue →"}
        </button>
      </form>
    </div>
  );
}

type ProjectInvestFormProps = {
  project: Project;
  isLoggedIn: boolean;
  kycApproved: boolean;
  currentPath: string;
  walletBalance?: number;
};

export function ProjectInvestForm(props: ProjectInvestFormProps) {
  return (
    <Suspense fallback={null}>
      <ProjectInvestFormInner {...props} />
    </Suspense>
  );
}
