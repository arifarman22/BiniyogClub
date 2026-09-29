/**
 * POST /api/webhooks/payment/[provider]
 *
 * Receives payment status callbacks from external providers.
 *
 * Security:
 *   - Raw body is read BEFORE parsing so HMAC signatures can be verified.
 *   - Signature verification happens inside the provider's verifyWebhook().
 *   - Duplicate events are rejected via the WebhookEvent unique constraint.
 *   - Investment activation ONLY happens after successful verification.
 *   - This route is NOT authenticated (providers call it directly).
 *     Security comes from the cryptographic signature, not session auth.
 *
 * URL: /api/webhooks/payment?provider=mock
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/server/services/payment.service";
import { getAvailableProviders } from "@/lib/payment/registry";
import type { PaymentProviderKey } from "@/lib/payment/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Resolve provider from query param
  const providerKey = req.nextUrl.searchParams.get("provider") as PaymentProviderKey | null;

  if (!providerKey || !getAvailableProviders().includes(providerKey)) {
    return NextResponse.json(
      { error: "Unknown or missing provider" },
      { status: 400 },
    );
  }

  // Read raw body BEFORE any parsing — required for HMAC verification
  let rawBody: Buffer;
  try {
    rawBody = Buffer.from(await req.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Parse JSON body (only used after signature is verified inside the provider)
  let parsedBody: Record<string, unknown>;
  try {
    parsedBody = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Collect headers
  const headers: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  try {
    const result = await paymentService.handleWebhook(providerKey, {
      rawBody,
      headers,
      parsedBody,
    });

    // Always return 200 to the provider — even for duplicates or non-success statuses.
    // Returning non-200 causes providers to retry, which we handle via deduplication.
    return NextResponse.json({
      received: true,
      gatewayPaymentId: result.gatewayPaymentId,
      status: result.status,
      investmentActivated: result.investmentActivated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";

    // Return 400 only for signature failures — tells the provider not to retry.
    // For all other errors return 500 so the provider retries (we deduplicate).
    if (message.includes("signature")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[webhook] processing error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

