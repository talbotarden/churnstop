/**
 * Competitor comparison data. Each entry powers a page at
 * /vs/[slug]. Content is deliberately factual rather than adversarial:
 * pricing is public, feature presence is observable, and platform fit
 * is where ChurnStop actually differentiates (WooCommerce-native vs
 * Shopify-first or platform-agnostic embeds).
 *
 * Numbers + claims as of 2025-Q1. Update `lastVerified` when pulling
 * a fresh round of public data.
 */

export interface CompareRow {
  label: string;
  us: string;
  them: string;
  note?: string;
}

export interface Comparison {
  slug: string;
  competitor: string;
  oneLiner: string;
  metaTitle: string;
  metaDescription: string;
  lastVerified: string;
  positioning: {
    us: string;
    them: string;
  };
  whenToChooseEach: {
    us: string[];
    them: string[];
  };
  matrix: CompareRow[];
  pricingNote: string;
  relatedPersonaSlugs: string[];
}

export const comparisons: Comparison[] = [
  {
    slug: 'churnkey',
    competitor: 'Churnkey',
    oneLiner:
      'Churnkey is a platform-agnostic cancellation + dunning SaaS. ChurnStop is a WooCommerce Subscriptions plugin.',
    metaTitle: 'ChurnStop vs Churnkey — WooCommerce-native vs platform-agnostic',
    metaDescription:
      'Compare ChurnStop and Churnkey for cancellation save flows. Plugin vs SaaS, WooCommerce-native vs platform-agnostic, pricing, FTC click-to-cancel compliance, feature matrix.',
    lastVerified: '2025-01',
    positioning: {
      us: 'A WordPress plugin built specifically for WooCommerce Subscriptions. Runs in the merchant\'s own WP admin; paid-tier features sync via a lightweight API.',
      them: 'A SaaS tool with embed scripts and native integrations into Stripe, Chargebee, Recurly. Strong pedigree in SaaS + B2B subscriptions.',
    },
    whenToChooseEach: {
      us: [
        'You run on WooCommerce Subscriptions and want the save flow to live inside WP Admin next to your subscriptions data',
        'You need a free tier that actually works without paid upgrade requirements',
        'You care about GPL + WordPress.org compatibility and open-source plugin code',
      ],
      them: [
        'You are on Stripe / Chargebee / Recurly and do not use WooCommerce',
        'You need Churnkey-specific features like card-swap dunning in the same product',
        'Your budget comfortably clears $400+/mo for a dedicated retention tool',
      ],
    },
    matrix: [
      { label: 'Platform fit', us: 'WooCommerce Subscriptions native', them: 'Stripe, Chargebee, Recurly (platform-agnostic)' },
      { label: 'Free tier', us: 'Yes — full save flow, no external dependency', them: 'No (trial only)' },
      { label: 'Starting price', us: '$79/mo (Starter)', them: '$399/mo (public pricing at time of check)' },
      { label: 'Hosted modal', us: 'Rendered by the plugin in WP Admin + front-end', them: 'External embed (JS snippet)' },
      { label: 'Click-to-cancel compliance validator', us: 'Yes — 5 runtime checks', them: 'Documented, not runtime-enforced' },
      { label: 'A/B testing', us: 'Starter tier', them: 'Core tier' },
      { label: 'Cohort LTV analytics', us: 'Growth tier', them: 'Yes' },
      { label: 'Winback email automation', us: 'Growth tier — 7/21/60 default', them: 'Yes' },
      { label: 'Dunning / failed-card recovery', us: 'Rely on WC Subs built-in retry', them: 'Built-in' },
      { label: 'Open source', us: 'GPL-2.0-or-later plugin core', them: 'Closed source SaaS' },
    ],
    pricingNote:
      'Churnkey pricing from their public site at the last check ($399/mo starting). ChurnStop free tier covers the full save flow with no external API dependency; paid tiers add A/B testing, cohort LTV, winback, agency white-label.',
    relatedPersonaSlugs: ['saas', 'replenishment', 'memberships'],
  },
  {
    slug: 'prosperstack',
    competitor: 'ProsperStack',
    oneLiner:
      'ProsperStack is a platform-agnostic retention SaaS focused on DTC + subscription commerce. ChurnStop is a WooCommerce Subscriptions plugin.',
    metaTitle: 'ChurnStop vs ProsperStack — WooCommerce plugin vs retention SaaS',
    metaDescription:
      'ChurnStop vs ProsperStack. Pricing, WooCommerce fit, free tier, click-to-cancel compliance, winback, and when to choose each. Honest feature matrix.',
    lastVerified: '2025-01',
    positioning: {
      us: 'WordPress plugin. Self-hosted save flow inside WP Admin. Free tier runs without external API.',
      them: 'Hosted retention platform with Stripe, Chargebee, Recurly, and custom integrations. Strong brand in DTC commerce.',
    },
    whenToChooseEach: {
      us: [
        'WooCommerce Subscriptions store; you want save-flow data in the same WP database as your subscriptions',
        'Want a free tier you can install today with no credit card',
        'Care about keeping customer data inside your own WordPress install',
      ],
      them: [
        'Multi-platform commerce (Shopify + custom) and need one save flow everywhere',
        'Need ProsperStack-specific benchmarks across their merchant network',
        'Comfortable with SaaS subscription spend for retention tooling',
      ],
    },
    matrix: [
      { label: 'Platform fit', us: 'WooCommerce Subscriptions native', them: 'Platform-agnostic SaaS' },
      { label: 'Free tier', us: 'Yes', them: 'No (paid only)' },
      { label: 'Starting price', us: '$79/mo (Starter)', them: 'Contact sales / custom' },
      { label: 'Data residency', us: 'Your own WordPress database', them: 'ProsperStack cloud' },
      { label: 'Click-to-cancel compliance validator', us: 'Yes — runtime checks', them: 'Documentation + consulting' },
      { label: 'A/B testing', us: 'Starter tier', them: 'Yes' },
      { label: 'Offer types', us: 'discount, pause, skip, tier-down, extend-trial, product-swap', them: 'Similar set, platform-defined' },
      { label: 'Cohort analytics', us: 'Growth tier', them: 'Yes' },
      { label: 'Winback sequence', us: 'Growth tier — 7/21/60 default, filterable', them: 'Yes' },
      { label: 'Plugin install path', us: 'wp-admin plugin upload, 5 min', them: 'JS embed + API integration' },
    ],
    pricingNote:
      'ProsperStack does not publish starter pricing; assume custom-sales for teams. ChurnStop starts at $0 (free tier) / $79/mo (Starter).',
    relatedPersonaSlugs: ['subscription-boxes', 'replenishment', 'memberships'],
  },
  {
    slug: 'brightback',
    competitor: 'Brightback (Chargebee Retain)',
    oneLiner:
      'Brightback was acquired by Chargebee and rebranded as Chargebee Retain. ChurnStop is a standalone WooCommerce plugin.',
    metaTitle: 'ChurnStop vs Brightback / Chargebee Retain',
    metaDescription:
      'ChurnStop vs Brightback (now Chargebee Retain). WooCommerce plugin vs Chargebee-integrated retention. Pricing, free tier, feature matrix, platform fit.',
    lastVerified: '2025-01',
    positioning: {
      us: 'WooCommerce Subscriptions plugin. Installable from WordPress.org with a free tier. Does not require a specific billing platform.',
      them: 'Chargebee\'s retention product since the 2022 Brightback acquisition. Best fit if you already run your billing on Chargebee.',
    },
    whenToChooseEach: {
      us: [
        'Your billing runs on WooCommerce Subscriptions, not Chargebee',
        'You need a save flow today without a billing-platform migration',
        'You want the plugin code to be inspectable under GPL',
      ],
      them: [
        'You are already a Chargebee customer and want a first-party retention module',
        'You need Chargebee-native billing events (invoice, credit, dunning) tied to the save flow',
      ],
    },
    matrix: [
      { label: 'Platform fit', us: 'WooCommerce Subscriptions native', them: 'Chargebee customers primarily' },
      { label: 'Free tier', us: 'Yes', them: 'Bundled with Chargebee plans' },
      { label: 'Standalone product', us: 'Yes', them: 'Now bundled into Chargebee' },
      { label: 'Pricing model', us: 'Flat monthly ($79–$399)', them: 'Tied to Chargebee plan pricing' },
      { label: 'Click-to-cancel compliance', us: 'Runtime validator', them: 'Chargebee + consulting' },
      { label: 'Install path', us: '5 min WP plugin install', them: 'Chargebee subscription + embed' },
      { label: 'Offer types', us: 'discount, pause, skip, tier-down, extend-trial, product-swap', them: 'Similar set' },
      { label: 'Open source', us: 'GPL-2.0-or-later', them: 'Closed' },
    ],
    pricingNote:
      'Since the Chargebee acquisition, Brightback is no longer sold standalone. If you do not already use Chargebee, ChurnStop is the simpler path.',
    relatedPersonaSlugs: ['saas', 'memberships'],
  },
  {
    slug: 'retainly',
    competitor: 'Retainly',
    oneLiner:
      'Retainly is a general-purpose retention + lifecycle marketing SaaS. ChurnStop is focused specifically on WooCommerce cancellation save flows.',
    metaTitle: 'ChurnStop vs Retainly — cancellation save flow vs lifecycle SaaS',
    metaDescription:
      'ChurnStop vs Retainly for WooCommerce subscription retention. Focused save flow vs broad lifecycle tool. Pricing, scope, and when to choose each.',
    lastVerified: '2025-01',
    positioning: {
      us: 'Single-purpose WooCommerce Subscriptions cancellation save flow. Does one thing well.',
      them: 'Broad lifecycle + retention marketing SaaS (emails, campaigns, segments, cancel flow as one of many features).',
    },
    whenToChooseEach: {
      us: [
        'You want the save flow inside WP Admin, running on your WooCommerce database',
        'You already have an email/marketing tool (MailPoet, Klaviyo) and do not need another',
        'You want the tightest possible implementation of the save flow specifically',
      ],
      them: [
        'You want one SaaS handling email, segmentation, campaigns, and cancel flow together',
        'Your team has capacity to manage a broader marketing platform',
      ],
    },
    matrix: [
      { label: 'Scope', us: 'Cancellation save flow only', them: 'Full lifecycle + marketing platform' },
      { label: 'WooCommerce integration', us: 'Native plugin', them: 'API / import' },
      { label: 'Starting price', us: '$0 free tier', them: 'Contact sales' },
      { label: 'Email sequences', us: 'Winback only (Growth tier)', them: 'Full broadcast + automation' },
      { label: 'Click-to-cancel compliance', us: 'Yes — runtime validator', them: 'Not a core feature' },
      { label: 'Plugin-style install', us: 'Yes', them: 'No (SaaS dashboard)' },
    ],
    pricingNote:
      'Retainly positions as a broader tool; pricing is typically consultative. ChurnStop is narrow and cheap on purpose.',
    relatedPersonaSlugs: ['memberships', 'online-courses'],
  },
  {
    slug: 'staymate',
    competitor: 'StayMate',
    oneLiner:
      'StayMate is a WooCommerce cancellation add-on with fewer offer types. ChurnStop is a more complete WooCommerce save flow with compliance + analytics.',
    metaTitle: 'ChurnStop vs StayMate — WooCommerce cancellation plugins compared',
    metaDescription:
      'ChurnStop vs StayMate for WooCommerce Subscriptions. Both are WP plugins — compare offer types, click-to-cancel compliance, A/B testing, winback, and pricing.',
    lastVerified: '2025-01',
    positioning: {
      us: 'Full cancellation save flow with 6 offer types, runtime compliance validator, A/B testing, cohort LTV, winback, and agency white-label.',
      them: 'Lightweight WooCommerce cancel deflection with a smaller offer set.',
    },
    whenToChooseEach: {
      us: [
        'You need more than two offer types — our router supports discount, pause, skip, tier-down, extend-trial, product-swap',
        'You care about FTC click-to-cancel compliance being enforced, not just documented',
        'You want A/B testing, cohort analytics, winback, and agency multi-site in one plugin',
      ],
      them: [
        'You want the smallest possible plugin surface and only need one or two offer types',
        'You do not need compliance enforcement at runtime',
      ],
    },
    matrix: [
      { label: 'Offer types', us: '6 (discount, pause, skip, tier-down, extend-trial, product-swap)', them: 'Typically 2–3' },
      { label: 'Click-to-cancel compliance validator', us: 'Yes — runtime', them: 'No' },
      { label: 'A/B testing', us: 'Starter tier, sticky bucketing + z-test', them: 'Limited' },
      { label: 'Cohort LTV analytics', us: 'Growth tier', them: 'No' },
      { label: 'Winback email sequence', us: 'Growth tier', them: 'No' },
      { label: 'Agency multi-site rollup', us: 'Agency tier', them: 'No' },
      { label: 'Free tier', us: 'Full save flow', them: 'Varies' },
      { label: 'Open source', us: 'GPL-2.0-or-later', them: 'Varies' },
    ],
    pricingNote:
      'Both are WordPress plugins. ChurnStop prices from free to $399/mo (Agency); StayMate-style plugins typically price on a one-time license model.',
    relatedPersonaSlugs: ['subscription-boxes', 'replenishment'],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug === slug);
}

export function comparisonSlugs(): string[] {
  return comparisons.map((c) => c.slug);
}
