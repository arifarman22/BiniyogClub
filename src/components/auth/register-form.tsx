"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { registerAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, Eye, EyeOff, Mail, Phone, User, Lock, ArrowRight, CreditCard, Users, CalendarDays, MapPin, Home } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BdAddressFields, EMPTY_BD_ADDRESS } from "@/components/auth/bd-address-fields";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { presentAddress: EMPTY_BD_ADDRESS, permanentAddress: EMPTY_BD_ADDRESS },
  });

  const [sameAddress, setSameAddress] = useState(false);

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password", "");
  const presentAddress = watch("presentAddress") ?? EMPTY_BD_ADDRESS;
  const permanentAddress = watch("permanentAddress") ?? EMPTY_BD_ADDRESS;

  useEffect(() => {
    setValue("role", "INVESTOR");
  }, [setValue]);

  // Keep the permanent address in step with the present one while "Same as present" is ticked.
  useEffect(() => {
    if (sameAddress) setValue("permanentAddress", presentAddress, { shouldValidate: isSubmitted });
  }, [sameAddress, presentAddress, setValue, isSubmitted]);

  // Latest allowed birth date: 18 years ago today.
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  })();

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await registerAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.push("/auth/login");
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" value="INVESTOR" {...register("role")} />

      {/* Row 1: Full Name + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Full Name <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Mohammad Arif"
              className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </div>
          {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
        </div>

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
              className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
        </div>
      </div>

      {/* Row 2: Phone + NID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="01712345678"
              className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="nidNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            NID Number <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="nidNumber"
              type="text"
              inputMode="numeric"
              placeholder="10 or 17 digit NID number"
              className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30"
              aria-invalid={!!errors.nidNumber}
              {...register("nidNumber")}
            />
          </div>
          {errors.nidNumber && <p className="text-xs text-destructive font-medium">{errors.nidNumber.message}</p>}
        </div>
      </div>

      {/* Date of birth */}
      <div className="space-y-1.5">
        <label htmlFor="dateOfBirth" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Date of Birth <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <CalendarDays className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="dateOfBirth"
            type="date"
            autoComplete="bday"
            max={maxDob}
            className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs"
            aria-invalid={!!errors.dateOfBirth}
            {...register("dateOfBirth")}
          />
        </div>
        {errors.dateOfBirth && <p className="text-xs text-destructive font-medium">{errors.dateOfBirth.message}</p>}
      </div>

      {/* Addresses */}
      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Present Address
        </legend>
        <BdAddressFields
          id="present"
          value={presentAddress}
          onChange={(next) => setValue("presentAddress", next, { shouldValidate: isSubmitted })}
          errors={errors.presentAddress}
        />
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-foreground">
          <Home className="h-3.5 w-3.5 text-primary" /> Permanent Address
        </legend>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={sameAddress}
            onChange={(e) => setSameAddress(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          Same as present address
        </label>
        <BdAddressFields
          id="permanent"
          value={permanentAddress}
          onChange={(next) => setValue("permanentAddress", next, { shouldValidate: isSubmitted })}
          errors={errors.permanentAddress}
          disabled={sameAddress}
        />
      </fieldset>

      {/* Nominee (optional) */}
      <div className="rounded-xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Nominee Details <span className="font-normal normal-case tracking-normal">(optional)</span>
          </p>
        </div>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 -mt-2">Your nominee will receive your investment in case of an emergency.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="nomineeName" className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Nominee Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-amber-500" />
              <Input
                id="nomineeName"
                type="text"
                placeholder="Nominee's full name"
                className="h-11 rounded-xl border-amber-300/60 bg-white dark:bg-slate-900 pl-10 text-sm focus-visible:ring-amber-400 shadow-xs placeholder:text-muted-foreground/30"
                aria-invalid={!!errors.nomineeName}
                {...register("nomineeName")}
              />
            </div>
            {errors.nomineeName && <p className="text-xs text-destructive font-medium">{errors.nomineeName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nomineeNidNumber" className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Nominee NID Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-amber-500" />
              <Input
                id="nomineeNidNumber"
                type="text"
                inputMode="numeric"
                placeholder="Nominee's NID number"
                className="h-11 rounded-xl border-amber-300/60 bg-white dark:bg-slate-900 pl-10 text-sm focus-visible:ring-amber-400 shadow-xs placeholder:text-muted-foreground/30"
                aria-invalid={!!errors.nomineeNidNumber}
                {...register("nomineeNidNumber")}
              />
            </div>
            {errors.nomineeNidNumber && <p className="text-xs text-destructive font-medium">{errors.nomineeNidNumber.message}</p>}
          </div>
        </div>
      </div>

      {/* Row 3: Password + Confirm Password */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Create Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="h-11 rounded-xl border-border/80 pl-10 pr-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30"
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
          {password.length > 0 && <PasswordStrengthBar strength={passwordStrength} />}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Confirm Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              className="h-11 rounded-xl border-border/80 pl-10 text-sm focus-visible:ring-primary shadow-xs placeholder:text-muted-foreground/30"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground pt-1">
        By registering, you agree to Biniyog Club&apos;s{" "}
        <Link href="/terms" className="font-semibold text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Spinner size="xs" />
        ) : (
          <>
            <span>Create Free Investor Account</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
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
  { label: "Good", color: "bg-emerald-500" },
  { label: "Strong", color: "bg-emerald-600" },
];

function PasswordStrengthBar({ strength }: { strength: 0 | 1 | 2 | 3 | 4 }) {
  const config = strengthConfig[strength];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength ? config.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium text-muted-foreground">Strength: {config.label}</p>
    </div>
  );
}
