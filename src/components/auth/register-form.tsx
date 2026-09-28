"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { registerAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, CheckCircle, Eye, EyeOff, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password", "");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await registerAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-muted">
          <CheckCircle className="size-7 text-success" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Check your email</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a verification link to your email address. Click it to activate your account.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <Link href="/auth/resend-verification" className="font-medium text-primary hover:underline">
            Resend email
          </Link>
        </p>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Role selector */}
      <FormField label="I want to" htmlFor="role" error={errors.role?.message} required>
        <div className="grid grid-cols-2 gap-2">
          {(["INVESTOR", "FARMER"] as const).map((role) => (
            <label
              key={role}
              className="relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                value={role}
                className="sr-only"
                {...register("role")}
              />
              <span className="text-lg">{role === "INVESTOR" ? "💰" : "🌾"}</span>
              <span className="text-sm font-medium">
                {role === "INVESTOR" ? "Invest" : "Farm"}
              </span>
              <span className="text-xs text-muted-foreground">
                {role === "INVESTOR" ? "Fund projects" : "List projects"}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="Full name" htmlFor="name" error={errors.name?.message} required>
        <div className="relative">
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="pl-9"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </div>
      </FormField>

      <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="pl-9"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
      </FormField>

      <FormField
        label="Phone number"
        htmlFor="phone"
        error={errors.phone?.message}
        hint="Bangladeshi number e.g. 01712345678"
        required
      >
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01712345678"
            className="pl-9"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </div>
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
        {password.length > 0 && (
          <PasswordStrengthBar strength={passwordStrength} />
        )}
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
        required
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      <p className="text-xs text-muted-foreground">
        By registering you agree to our{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size="xs" className="mr-2" />}
        Create account
      </Button>
    </form>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────

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
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength ? config.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{config.label}</p>
    </div>
  );
}
