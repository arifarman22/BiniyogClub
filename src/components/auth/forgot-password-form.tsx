"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validations/auth";
import { forgotPasswordAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/loading";
import { CheckCircle, Mail } from "lucide-react";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    await forgotPasswordAction(data);
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
            If an account exists for <strong>{getValues("email")}</strong>, we sent a password reset link. It expires in 1 hour.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size="xs" className="mr-2" />}
        Send reset link
      </Button>
    </form>
  );
}
