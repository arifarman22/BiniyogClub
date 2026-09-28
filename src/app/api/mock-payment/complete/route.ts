/**
 * GET /api/mock-payment/complete
 *
 * Development-only endpoint that simulates a provider completing a payment
 * and firing a webhook back to our server.
 *
 * Flow:
 *   1. Mock provider checkout URL redirects here.
 *   2. This endpoint fires a signed webhook to our own webhook handler.
 *   3. The webhook handler verifies + activates the investment.
 *   4. This endpoint redirects the user to the success/cancel URL.
 *
 * This endpoint is DISABLED in production.
 */

import { createHmac, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = req.nextUrl;
  const paymentId = searchParams.get("paymentId");
  const idempotencyKey = searchParams.get("idempotencyKey");

  if (!paymentId || !idempotencyKey) {
    return NextResponse.json({ error: "Missing paymentId or idempotencyKey" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookSecret =
    process.env.MOCK_WEBHOOK_SECRET ?? "mock-webhook-secret-do-not-use-in-production";

  // Build the webhook payload
  const payload = {
    eventId: `mock_evt_${randomUUID()}`,
    eventType: "payment.success",
    paymentId,
    status: "SUCCESS",
    amount: 0, // mock provider resolves amount from its in-memory store
    currency: "BDT",
  };

  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", webhookSecret).update(body).digest("hex");

  // Fire the webhook to our own handler
  try {
    const webhookUrl = `${appUrl}/api/webhooks/payment?provider=mock`;
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mock-signature": signature,
      },
      body,
    });
  } catch (err) {
    console.error("[mock-payment] failed to fire webhook:", err);
  }

  // Redirect to the success page — frontend must call verifyPaymentAction
  // to confirm activation before showing a success message.
  const successUrl = `${appUrl}/dashboard/investments?verify=1&paymentId=${paymentId}`;
  return NextResponse.redirect(successUrl);
}
