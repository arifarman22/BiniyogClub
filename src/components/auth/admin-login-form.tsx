"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { loginAction } from "@/server/actions/auth.actions";
import { useState } from "react";
import { Eye, EyeOff, ShieldAlert, Loader2 } from "lucide-react";

const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "SUPPORT"];

const ROLE_DESTINATIONS: Record<string, string> = {
  SUPER_ADMIN:     "/admin",
  ADMIN:           "/admin",
  FINANCE_OFFICER: "/admin/payments",
  PROJECT_MANAGER: "/admin/projects",
  KYC_OFFICER:     "/admin/kyc",
  SUPPORT:         "/admin/users",
};

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const result = await loginAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    const { role } = result.data;
    if (!STAFF_ROLES.includes(role)) {
      setServerError("Access denied. This portal is restricted to authorized staff only.");
      return;
    }
    window.location.href = ROLE_DESTINATIONS[role] ?? "/admin";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-medium uppercase tracking-widest text-slate-400">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@biniyogclub.com"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:bg-white/8 focus:ring-1 focus:ring-emerald-500/30"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-medium uppercase tracking-widest text-slate-400">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:bg-white/8 focus:ring-1 focus:ring-emerald-500/30"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="relative w-full overflow-hidden rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Authenticating…
          </span>
        ) : (
          "Access Admin Panel"
        )}
      </button>
    </form>
  );
}
