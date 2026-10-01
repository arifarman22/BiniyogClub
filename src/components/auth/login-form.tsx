"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { loginAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, Eye, EyeOff, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; code?: string } | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const result = await loginAction(data);
    if (!result.success) {
      setServerError({ message: result.error, code: result.code });
      return;
    }
    const role = result.data.role;
    const defaultDest =
      role === "INVESTOR" ? "/dashboard" :
      ["ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "FIELD_OFFICER", "SUPPORT"].includes(role)
        ? "/admin"
        : "/";
    window.location.href = callbackUrl ?? defaultDest;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <Alert variant={serverError.code === "EMAIL_NOT_VERIFIED" ? "default" : "destructive"} className="rounded-xl">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {serverError.message}
            {serverError.code === "EMAIL_NOT_VERIFIED" && (
              <span>
                {" "}
                <Link href="/auth/resend-verification" className="font-medium underline">
                  Resend verification email
                </Link>
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 rounded-xl pl-10 text-sm focus-visible:ring-primary"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password <span className="text-destructive">*</span>
          </label>
          <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 rounded-xl pl-10 pr-10 text-sm focus-visible:ring-primary"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Spinner size="xs" />}
        Sign in
      </button>
    </form>
  );
}
