"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { registerAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, Eye, EyeOff, Mail, Phone, User, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password", "");

  useEffect(() => { setValue("role", "INVESTOR"); }, [setValue]);

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await registerAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    window.location.href = "/auth/login";
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTriangle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" value="INVESTOR" {...register("role")} />

      {/* Full name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Full name <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="h-11 rounded-xl pl-10 text-sm focus-visible:ring-primary"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </div>
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

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

      {/* Phone */}
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          Phone number <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01712345678"
            className="h-11 rounded-xl pl-10 text-sm focus-visible:ring-primary"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </div>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        <p className="text-xs text-muted-foreground">Bangladeshi number e.g. 01712345678</p>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
        {password.length > 0 && <PasswordStrengthBar strength={passwordStrength} />}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-11 rounded-xl pl-10 text-sm focus-visible:ring-primary"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        By registering you agree to our{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Spinner size="xs" />}
        Create account
      </button>
    </form>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

const strengthConfig = [
  { label: "Too short", color: "bg-destructive" },
  { label: "Weak", color: "bg-destructive" },
  { label: "Fair", color: "bg-warning" },
  { label: "Good", color: "bg-harvest-500" },
  { label: "Strong", color: "bg-success" },
];

function PasswordStrengthBar({ strength }: { strength: 0 | 1 | 2 | 3 | 4 }) {
  const config = strengthConfig[strength];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${level <= strength ? config.color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{config.label}</p>
    </div>
  );
}
