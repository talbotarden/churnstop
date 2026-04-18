/**
 * BillingAdapter - the extension seam for Phase 2 universal expansion.
 *
 * In Phase 1, ChurnStop only ships a WooCommerce plugin and the plugin applies
 * offers locally via WC Subs APIs. The backend (`apps/api`) does NOT execute
 * offers itself.
 *
 * In Phase 2, when the universal JavaScript embed and Stripe / Paddle / Recurly
 * billing platforms are added, offer execution will move server-side. Each
 * supported platform implements this interface in a sibling file
 * (`stripe.ts`, `paddle.ts`, etc.). Routes never branch on `platform` directly;
 * they look the adapter up in a registry keyed by `platform`.
 *
 * Inputs are abstract subscription identifiers + offer parameters. The
 * adapter is responsible for translating "20% for 3 cycles" into the
 * platform's native concepts (Stripe coupons, Paddle adjustments, etc.).
 *
 * See docs/ADR-001-phased-universal-expansion.md for context.
 */

export interface AdapterContext {
  platform: string;
  externalSubscriptionId: string;
  externalCustomerId?: string;
  metadata?: Record<string, unknown>;
}

export interface DiscountOffer {
  valueCents: number | null;
  valuePercent: number | null;
  durationBillingCycles: number;
}

export interface PauseOffer {
  durationDays: number;
}

export interface AdapterResult {
  ok: boolean;
  error?: string;
}

export interface BillingAdapter {
  applyDiscount(ctx: AdapterContext, offer: DiscountOffer): Promise<AdapterResult>;
  applyPause(ctx: AdapterContext, offer: PauseOffer): Promise<AdapterResult>;
  skipNextRenewal(ctx: AdapterContext): Promise<AdapterResult>;
  cancelSubscription(ctx: AdapterContext): Promise<AdapterResult>;
}
