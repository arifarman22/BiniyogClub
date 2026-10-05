"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { forgotPasswordAction, verifyPasswordResetOtpAction } from "@/server/actions/auth.actions";
import { Mail, ArrowRight, RotateCcw, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

type Step = "email" | "otp";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown() {
    setSecondsLeft(30);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError(null);
    setLoading(true);
    const result = await forgotPasswordAction({ email: email.trim() });
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    if (!result.data.found) {
      setError("No account found with this email address.");
      return;
    }
    setStep("otp");
    startCountdown();
  }

  async function handleResend() {
    if (!canResend) return;
    setError(null);
    setLoading(true);
    const result = await forgotPasswordAction({ email });
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setOtp("");
    startCountdown();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("Please enter the 6-digit code."); return; }
    setError(null);
    setLoading(true);
    const result = await verifyPasswordResetOtpAction(email, otp);
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Invalid or expired code."); return; }
    router.push(`/auth/reset-password?token=${result.data.resetToken}`);
  }

  if (step === "email") {
    return (
      <form onSubmit={handleSendOtp} noValidate className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Sending code…" : "Send verification code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
      {/* Sent confirmation */}
      <div className="rounded-lg border border-success/30 bg-success-muted/40 px-4 py-3 text-sm text-success">
        <p className="font-medium">Code sent to <span className="font-semibold">{email}</span></p>
        <p className="mt-0.5 text-xs text-muted-foreground">Check your inbox and enter the 6-digit code below.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* OTP input */}
      <div className="space-y-1.5">
        <label htmlFor="otp" className="text-sm font-medium text-foreground">
          Verification code
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(null); }}
          className="w-full rounded-lg border border-input bg-background py-3 text-center font-mono text-2xl tracking-[0.5em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </div>

      {/* Countdown / resend */}
      <div className="flex items-center justify-between text-sm">
        {secondsLeft > 0 ? (
          <span className="text-muted-foreground">
            Code expires in{" "}
            <span className={`font-semibold tabular-nums ${secondsLeft <= 10 ? "text-destructive" : "text-foreground"}`}>
              {secondsLeft}s
            </span>
          </span>
        ) : (
          <span className="text-destructive text-xs font-medium">Code expired</span>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || loading}
          className="flex items-center gap-1.5 text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Resend code
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {loading ? "Verifying…" : "Verify & continue"}
      </button>

      <button
        type="button"
        onClick={() => { setStep("email"); setOtp(""); setError(null); if (timerRef.current) clearInterval(timerRef.current); }}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
      >
        ← Use a different email
      </button>
    </form>
  );
}
