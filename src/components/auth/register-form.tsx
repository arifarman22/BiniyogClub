"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { registerAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, Eye, EyeOff, Mail, Phone, User, Lock, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Format typed digits as DD/MM/YYYY (slashes inserted automatically). */
function maskDmy(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Short signup: name, optional email, phone, date of birth and password.
 * NID, addresses and nominee are added later from the investor's profile.
 */
export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    setValue("role", "INVESTOR");
  }, [setValue]);

  const dob = register("dateOfBirth");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await registerAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.push("/auth/login");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" value="INVESTOR" {...register("role")} />

      {/* Full name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className={labelCls}>
          Full Name <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="name" type="text" autoComplete="name" placeholder="Mohammad Arif" className={inputCls} aria-invalid={!!errors.name} {...register("name")} />
        </div>
        {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className={labelCls}>
            Phone Number <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01712345678" className={inputCls} aria-invalid={!!errors.phone} {...register("phone")} />
          </div>
          {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>}
        </div>

        {/* Email (optional) */}
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelCls}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="investor@example.com" className={inputCls} aria-invalid={!!errors.email} {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
        </div>
      </div>

      {/* Date of birth */}
      <div className="space-y-1.5">
        <label htmlFor="dateOfBirth" className={labelCls}>
          Date of Birth <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <CalendarDays className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="dateOfBirth"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="DD/MM/YYYY"
            maxLength={10}
            className={inputCls}
            aria-invalid={!!errors.dateOfBirth}
            {...dob}
            onChange={(e) => {
              e.target.value = maskDmy(e.target.value);
              dob.onChange(e);
            }}
          />
        </div>
        {errors.dateOfBirth && <p className="text-xs text-destructive font-medium">{errors.dateOfBirth.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className={labelCls}>
          Create Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            className={`${inputCls} pr-10`}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className={labelCls}>
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className={`${inputCls} pr-10`}
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
      </div>

      <p className="pt-1 text-xs text-muted-foreground">
        You can add your NID, address and nominee later from your profile. By registering, you agree to Biniyog Club&apos;s{" "}
        <Link href="/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-primary/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <Spinner size="xs" />
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
