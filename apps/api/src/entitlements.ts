/**
 * Plan definitions and feature entitlements. Single source of truth used by
 * /license/verify, /license/entitlements, /checkout, and the Stripe webhook.
 *
 * The plugin pulls this map via the license endpoints and caches it locally.
 * Gating in the plugin (AbTestManager, CohortLtv, Winback, etc.) checks
 * `LicenseManager::has($feature)` which reads from the cached entitlements.
 * Adding a new feature here plus the code that honours it is a one-sided
 * change: the plugin picks up the new flag on its next license refresh.
 */

export type Tier = 'free' | 'starter' | 'growth' | 'agency';

export type Feature =
  | 'basic_flow'
  | 'compliance_validator'
  | 'gdpr_hooks'
  | 'six_offer_types'
  | 'conditional_branching'
  | 'save_rate_dashboard'
  | 'rate_limit_window'
  | 'email_support'
  | 'ab_testing'
  | 'cohort_ltv'
  | 'winback_automation'
  | 'customer_segmentation'
  | 'priority_support'
  | 'white_label'
  | 'multi_site'
  | 'cross_store_benchmarks'
  | 'sla_support';

export interface PlanDefinition {
  tier: Tier;
  label: string;
  priceCents: number;             // monthly; 0 for free
  yearlyPriceCents: number;       // 20% off annual
  maxSites: number;               // site activation cap per license
  mrrCeilingCents: number;        // 0 for unlimited
  features: Feature[];
}

// The feature vectors each plan unlocks. Adding a feature here immediately
// makes it visible to plugins on the next entitlements refresh.
export const PLANS: Record<Tier, PlanDefinition> = {
  free: {
    tier: 'free',
    label: 'Free',
    priceCents: 0,
    yearlyPriceCents: 0,
    maxSites: 1,
    mrrCeilingCents: 0,
    features: [
      'basic_flow',
      'compliance_validator',
      'gdpr_hooks',
      'rate_limit_window',
    ],
  },
  starter: {
    tier: 'starter',
    label: 'Starter',
    priceCents: 7900,
    yearlyPriceCents: 75840,       // 7900 * 12 * 0.8
    maxSites: 1,
    mrrCeilingCents: 1_000_000,    // $10k
    features: [
      'basic_flow',
      'compliance_validator',
      'gdpr_hooks',
      'six_offer_types',
      'conditional_branching',
      'save_rate_dashboard',
      'rate_limit_window',
      'email_support',
      'ab_testing',
    ],
  },
  growth: {
    tier: 'growth',
    label: 'Growth',
    priceCents: 19900,
    yearlyPriceCents: 191040,      // 19900 * 12 * 0.8
    maxSites: 3,
    mrrCeilingCents: 5_000_000,    // $50k
    features: [
      'basic_flow',
      'compliance_validator',
      'gdpr_hooks',
      'six_offer_types',
      'conditional_branching',
      'save_rate_dashboard',
      'rate_limit_window',
      'email_support',
      'ab_testing',
      'cohort_ltv',
      'winback_automation',
      'customer_segmentation',
      'priority_support',
    ],
  },
  agency: {
    tier: 'agency',
    label: 'Agency',
    priceCents: 39900,
    yearlyPriceCents: 383040,      // 39900 * 12 * 0.8
    maxSites: 25,
    mrrCeilingCents: 0,            // unlimited
    features: [
      'basic_flow',
      'compliance_validator',
      'gdpr_hooks',
      'six_offer_types',
      'conditional_branching',
      'save_rate_dashboard',
      'rate_limit_window',
      'email_support',
      'ab_testing',
      'cohort_ltv',
      'winback_automation',
      'customer_segmentation',
      'priority_support',
      'white_label',
      'multi_site',
      'cross_store_benchmarks',
      'sla_support',
    ],
  },
};

export function isTier(v: unknown): v is Tier {
  return v === 'free' || v === 'starter' || v === 'growth' || v === 'agency';
}

/**
 * Resolve a Stripe price-id to a plan tier. The mapping is environment
 * driven so test-mode and live-mode price ids can both work against the
 * same codebase; set STRIPE_PRICE_STARTER_MONTHLY etc. in the API env.
 */
export function priceIdToTier(priceId: string): Tier | null {
  const map: Record<string, Tier> = {};
  const envMap: Array<[string, Tier]> = [
    ['STRIPE_PRICE_STARTER_MONTHLY', 'starter'],
    ['STRIPE_PRICE_STARTER_YEARLY', 'starter'],
    ['STRIPE_PRICE_GROWTH_MONTHLY', 'growth'],
    ['STRIPE_PRICE_GROWTH_YEARLY', 'growth'],
    ['STRIPE_PRICE_AGENCY_MONTHLY', 'agency'],
    ['STRIPE_PRICE_AGENCY_YEARLY', 'agency'],
  ];
  for (const [envVar, tier] of envMap) {
    const id = process.env[envVar];
    if (id) map[id] = tier;
  }
  return map[priceId] ?? null;
}

/**
 * Return the Stripe price id for a tier + billing cadence. Returns null
 * when the price id is not configured in the environment (so the UI can
 * show "not configured" instead of crashing).
 */
export function tierToPriceId(tier: Tier, cadence: 'monthly' | 'yearly'): string | null {
  if (tier === 'free') return null;
  const key = `STRIPE_PRICE_${tier.toUpperCase()}_${cadence.toUpperCase()}`;
  return process.env[key] ?? null;
}

export function entitlementsForTier(tier: Tier) {
  const plan = PLANS[tier];
  return {
    tier: plan.tier,
    label: plan.label,
    features: plan.features,
    maxSites: plan.maxSites,
    mrrCeilingCents: plan.mrrCeilingCents,
  };
}
