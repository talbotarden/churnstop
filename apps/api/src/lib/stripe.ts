/**
 * Stripe client factory. Lazy-initialised so routes that never touch Stripe
 * don't crash the process when the key isn't set. When the key is the default
 * placeholder (`sk_test_...`), `isConfigured()` returns false so the caller
 * can return a 503 with "Stripe not configured" rather than emitting a broken
 * API call.
 */

import Stripe from 'stripe';

let cachedClient: Stripe | null = null;

export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (!key || key === 'sk_test_...' || key.length < 20) {
    throw new Error(
      'Stripe secret key is not configured. Set STRIPE_SECRET_KEY in apps/api/.env to a real sk_test_* or sk_live_* value.',
    );
  }
  if (!cachedClient) {
    cachedClient = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
      telemetry: false,
      maxNetworkRetries: 2,
    });
  }
  return cachedClient;
}

export function isConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  return !!key && key !== 'sk_test_...' && key.length >= 20;
}

export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  if (!secret || secret === 'whsec_...' || secret.length < 20) {
    throw new Error(
      'Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET to the value from the Stripe dashboard > Developers > Webhooks.',
    );
  }
  return secret;
}
