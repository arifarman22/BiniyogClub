"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { loginAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER", "SUPPORT"];

const ROLE_DESTINATIONS: Record<string, string> = {
  SUPER_ADMIN:     "/admin",
  ADMIN:           "/admin",
  FINANCE_OFFICER: "/admin/payments",
  PROJECT_MANAGER: "/admin/projects",
  KYC_OFFICER:     "/admin/kyc",
  SUPPORT:         "/admin/users",
};

export function StaffLoginForm() {
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
      setServerError("This portal is for staff only. Please use the investor login.");
      return;
    }
    window.location.href = ROLE_DESTINATIONS[role] ?? "/admin";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@biniyog.dev"
            className="pl-9"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormField>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="xs" className="mr-2" /> : <ShieldCheck className="mr-2 size-4" />}
        Sign in to Staff Portal
      </Button>
    </form>
  );
}
