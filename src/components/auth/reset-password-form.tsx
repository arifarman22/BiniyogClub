"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validations/auth";
import { resetPasswordAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    const result = await resetPasswordAction(data);
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
          <p className="font-semibold text-foreground">Password reset successfully</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {serverError}{" "}
            {serverError.toLowerCase().includes("expired") && (
              <Link href="/auth/forgot-password" className="font-medium underline">
                Request a new link
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      <input type="hidden" {...register("token")} />

      <FormField label="New password" htmlFor="password" error={errors.password?.message} required>
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
      </FormField>

      <FormField
        label="Confirm new password"
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size="xs" className="mr-2" />}
        Reset password
      </Button>
    </form>
  );
}
