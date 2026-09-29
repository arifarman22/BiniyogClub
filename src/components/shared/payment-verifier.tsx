"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { verifyPaymentByProviderIdAction } from "@/server/actions/payment.actions";

/**
 * Mounts invisibly on the investments page.
 * When ?verify=1&paymentId=<providerPaymentId> is present (redirect from checkout),
 * it calls verifyPaymentByProviderIdAction, shows a toast, then cleans the URL.
 */
export function PaymentVerifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const shouldVerify = searchParams.get("verify") === "1";
    const providerPaymentId = searchParams.get("paymentId");
    if (!shouldVerify || !providerPaymentId) return;

    ran.current = true;

    verifyPaymentByProviderIdAction(providerPaymentId).then((result) => {
      if (result.success && result.data?.investmentActivated) {
        toast.add({
          title: "Payment confirmed!",
          description: result.data.receiptNumber
            ? `Receipt: ${result.data.receiptNumber}`
            : "Your investment is now active.",
          type: "success",
        });
      } else if (result.success && !result.data?.investmentActivated) {
        toast.add({
          title: "Payment pending",
          description: "Your payment is being processed. We'll notify you once confirmed.",
          type: "info",
        });
      } else {
        toast.add({
          title: "Payment verification failed",
          description: (result as { success: false; error: string }).error ?? "Please contact support if the issue persists.",
          type: "error",
        });
      }

      // Clean query params without a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("verify");
      url.searchParams.delete("paymentId");
      router.replace(url.pathname + url.search, { scroll: false });
    });
  }, [searchParams, router]);

  return null;
}
