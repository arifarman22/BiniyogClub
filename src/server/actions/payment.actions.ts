"use server";

import { paymentService } from "@/server/services/payment.service";
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
} from "@/validations/payment";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";
import type { PaymentVerificationResult } from "@/lib/payment/types";

function serviceError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
  console.error("[payment action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Initiate payment ─────────────────────────────────────────────────────────

export async function initiatePaymentAction(
  formData: unknown,
): Promise<ActionResult<{ gatewayPaymentId: string; checkoutUrl: string | null }>> {
  const parsed = initiatePaymentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const session = await requireSession();
    const { gatewayPayment } = await paymentService.initiatePayment(session, {
      investmentId: parsed.data.investmentId,
      provider: parsed.data.provider,
      amountBdt: 0, // resolved from investment record inside service
      successUrl: parsed.data.successUrl,
      cancelUrl: parsed.data.cancelUrl,
      mobileNumber: parsed.data.mobileNumber,
    });

    revalidatePath("/dashboard/investments");

    return {
      success: true,
      data: {
        gatewayPaymentId: gatewayPayment.id,
        checkoutUrl: gatewayPayment.checkoutUrl,
      },
    };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Verify payment (server-side polling) ────────────────────────────────────
//
// Called when the frontend receives a success redirect from the provider.
// The frontend MUST call this action — it MUST NOT directly activate the investment.
// This action re-queries the provider server-side before doing anything.

export async function verifyPaymentAction(
  formData: unknown,
): Promise<ActionResult<PaymentVerificationResult>> {
  const parsed = verifyPaymentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    await requireSession();
    const result = await paymentService.verifyPaymentByPolling(parsed.data.gatewayPaymentId);

    if (result.investmentActivated) {
      revalidatePath("/dashboard/investments");
      revalidatePath("/dashboard/transactions");
      revalidatePath("/admin/projects");
    }

    return { success: true, data: result };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Refund payment ───────────────────────────────────────────────────────────

export async function refundPaymentAction(
  formData: unknown,
): Promise<ActionResult<{ refundId: string }>> {
  const parsed = refundPaymentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    await requireSession();
    const result = await paymentService.refundPayment(
      parsed.data.gatewayPaymentId,
      parsed.data.reason,
    );

    revalidatePath("/dashboard/investments");
    revalidatePath("/admin/payments");

    return { success: true, data: { refundId: result.refundId } };
  } catch (error) {
    return serviceError(error);
  }
}
