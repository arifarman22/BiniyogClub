/**
 * payment/registry.ts
 *
 * Provider registry. All providers are registered here.
 * The rest of the application resolves providers through getProvider().
 *
 * To add a new provider:
 *   1. Implement PaymentProvider in providers/<name>.provider.ts
 *   2. Import and register it here.
 */

import type { PaymentProvider, PaymentProviderKey } from "./types";
import { mockProvider } from "./providers/mock.provider";
import { bkashProvider } from "./providers/bkash.provider";
import { nagadProvider } from "./providers/nagad.provider";
import { cardProvider } from "./providers/card.provider";
import { bankProvider } from "./providers/bank.provider";

const registry = new Map<PaymentProviderKey, PaymentProvider>([
  ["mock",  mockProvider],
  ["bkash", bkashProvider],
  ["nagad", nagadProvider],
  ["card",  cardProvider],
  ["bank",  bankProvider],
]);

export function getProvider(key: PaymentProviderKey): PaymentProvider {
  const provider = registry.get(key);
  if (!provider) throw new Error(`Unknown payment provider: "${key}"`);
  return provider;
}

export function getAvailableProviders(): PaymentProviderKey[] {
  return Array.from(registry.keys());
}

/** Returns the provider key to use in the current environment. */
export function getDefaultProvider(): PaymentProviderKey {
  if (process.env.NODE_ENV !== "production") return "mock";
  const key = process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProviderKey | undefined;
  if (key && registry.has(key)) return key;
  throw new Error(
    "DEFAULT_PAYMENT_PROVIDER env var is not set or invalid. " +
      "Set it to one of: bkash, nagad, card, bank",
  );
}
