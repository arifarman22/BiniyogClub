"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { loginAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; code?: string } | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "FIELD_OFFICER", "SUPPORT"];

  // Never allow callbackUrl to point to /admin from the investor login
  const safeDest = callbackUrl && !callbackUrl.startsWith("/admin") ? callbackUrl : "/dashboard";

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const result = await loginAction(data);
    if (!result.success) {
      setServerError({ message: result.error, code: result.code });
      return;
    }
    const { role } = result.data;
    if (STAFF_ROLES.includes(role)) {
      setServerError({ message: "Staff accounts must use the Admin Portal to sign in." });
      return;
    }
    router.push(safeDest);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <Alert variant={serverError.code === "EMAIL_NOT_VERIFIED" ? "default" : "destructive"} className="rounded-2xl">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {serverError.message}
            {serverError.code === "EMAIL_NOT_VERIFIED" && (
              <span>
                {" "}
                <Link href="/auth/resend-verification" className="font-semibold underline">
                  Resend verification email
                </Link>
              </span>
            )}
            {serverError.message.includes("Admin Portal") && (
              <span>
                {" "}
                <Link href="/admin/login" className="font-semibold underline">
                  Go to Admin Portal →
                </Link>
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="investor@example.com"
            className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password <span className="text-destructive">*</span>
          </label>
          <Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">
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
            className="h-11 rounded-xl border-border/80 pl-10 pr-10 text-sm focus-visible:ring-primary shadow-xs"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Spinner size="xs" />
        ) : (
          <>
            <span>Sign In to Portfolio</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
