/**
 * Per-vertical save-flow data. Each persona describes a subscription
 * business model and the reason-to-offer routing table that works best
 * for it. Volumes + benchmarks are sourced inline so the programmatic
 * page can cite them without inventing numbers.
 *
 * These pages target intent like "woocommerce subscription boxes
 * cancellation flow", "reduce churn on memberships", etc. The unique
 * data per page is the routing table + vertical-specific benchmarks,
 * not just a variable-swap of the landing page.
 */

export type OfferType = 'discount' | 'pause' | 'skip-renewal' | 'tier-down' | 'extend-trial' | 'product-swap';

export interface RoutingRule {
  reason: string;
  offer: OfferType;
  rationale: string;
}

export interface Benchmark {
  label: string;
  value: string;
  source: string;
}

export interface Persona {
  slug: string;
  vertical: string;
  shortLabel: string;
  metaTitle: string;
  metaDescription: string;
  hero: {
    headline: string;
    subhead: string;
  };
  businessShape: {
    typicalMrr: string;
    typicalAov: string;
    renewalCadence: string;
    primaryChurnDrivers: string[];
  };
  benchmarks: Benchmark[];
  routingTable: RoutingRule[];
  wcProducts: string[];
  mathExample: {
    mrr: number;
    attemptsPerMonth: number;
    defaultSaveRate: number;
    optimizedSaveRate: number;
    avgMonthlyValue: number;
  };
  relatedBlogSlugs: string[];
}

export const personas: Persona[] = [
  {
    slug: 'subscription-boxes',
    vertical: 'Subscription boxes',
    shortLabel: 'Subscription box stores',
    metaTitle: 'Reduce cancellations on WooCommerce subscription boxes',
    metaDescription:
      'ChurnStop save flows for WooCommerce subscription boxes. Skip-renewal for busy months, pause for travel, product-swap for variety fatigue. 35–45% typical save rate.',
    hero: {
      headline: 'Save flows tuned for subscription boxes.',
      subhead:
        'Box stores get hit hardest on schedule conflicts and variety fatigue, not price. ChurnStop routes "not using" to skip-renewal and "missing a feature" to product-swap so you stop discounting churn you did not cause.',
    },
    businessShape: {
      typicalMrr: '$5k–$200k MRR',
      typicalAov: '$20–$45 per box',
      renewalCadence: 'Monthly or every 4 weeks',
      primaryChurnDrivers: [
        'Received too many boxes, falling behind',
        'Not using the items fast enough',
        'Gift subscriptions expiring',
        'Variety fatigue — same products repeating',
      ],
    },
    benchmarks: [
      { label: 'Typical save rate', value: '35–45%', source: 'Churnkey 2024 subscription-box cohort' },
      { label: 'Monthly gross churn', value: '8–12%', source: 'ProsperStack 2023 box benchmarks' },
      { label: 'Pause take-rate', value: '22–30% of saves', source: 'ChurnStop internal (pause vs discount blog)' },
    ],
    routingTable: [
      {
        reason: 'not_using',
        offer: 'skip-renewal',
        rationale: 'Box customers almost never churn on not-using because of the product — it is scheduling. Skip the next shipment and the customer reorders when they are caught up.',
      },
      {
        reason: 'too_expensive',
        offer: 'discount',
        rationale: 'A 20% off 3 cycles coupon preserves the relationship without giving away the full renewal.',
      },
      {
        reason: 'missing_feature',
        offer: 'product-swap',
        rationale: 'Most subscription boxes sell multiple box types. Switch to the companion box in the same group before offering a discount.',
      },
      {
        reason: 'switching',
        offer: 'discount',
        rationale: 'Price-match or beat the competing box for one cycle. Switchers rarely return after they cancel.',
      },
      {
        reason: 'technical',
        offer: 'extend-trial',
        rationale: 'Technical friction (shipping, billing) resolves quickly. Extend the current window and let support follow up.',
      },
      {
        reason: 'other',
        offer: 'pause',
        rationale: 'When in doubt, pause. The save rate on pause offers in boxes is 22–30%, higher than discount.',
      },
    ],
    wcProducts: [
      'Subscriptio',
      'WooCommerce Subscriptions (native)',
      'SUMO Subscriptions',
      'WooCommerce Memberships + Subscriptions combo',
    ],
    mathExample: {
      mrr: 20000,
      attemptsPerMonth: 120,
      defaultSaveRate: 0.18,
      optimizedSaveRate: 0.40,
      avgMonthlyValue: 29,
    },
    relatedBlogSlugs: ['woocommerce-churn-benchmarks', 'pause-vs-discount'],
  },
  {
    slug: 'saas',
    vertical: 'SaaS on WooCommerce',
    shortLabel: 'SaaS products',
    metaTitle: 'Cancellation save flow for SaaS on WooCommerce',
    metaDescription:
      'ChurnStop for SaaS merchants running on WooCommerce Subscriptions. Route price objections to tier-down, not-using to pause, and keep click-to-cancel compliance.',
    hero: {
      headline: 'For SaaS, tier-down beats discount.',
      subhead:
        'Price-sensitive SaaS customers cancel because their job-to-be-done shrank, not because they hate you. Moving them to a cheaper plan preserves the integration and the account, which a discount coupon does not.',
    },
    businessShape: {
      typicalMrr: '$3k–$100k MRR',
      typicalAov: '$19–$199 per month',
      renewalCadence: 'Monthly, yearly with monthly fallback',
      primaryChurnDrivers: [
        'Seat count shrank (layoff, reorg)',
        'Switched to a bundled competitor',
        'Feature they wanted never shipped',
        'Onboarding stalled — never got to value',
      ],
    },
    benchmarks: [
      { label: 'Typical save rate', value: '20–30%', source: 'Recurly 2024 SaaS cohort' },
      { label: 'Voluntary churn', value: '3.5–5.5%/mo', source: 'Recurly 2024' },
      { label: 'Tier-down acceptance', value: '28% of cancellations', source: 'Baremetrics 2023 downgrade study' },
    ],
    routingTable: [
      {
        reason: 'too_expensive',
        offer: 'tier-down',
        rationale: 'Preserve the account at a lower tier. Tier-down beats discount for SaaS because the discount expires and they churn anyway.',
      },
      {
        reason: 'not_using',
        offer: 'pause',
        rationale: 'Seasonal SaaS workflows (accounting, recruiting) see predictable lulls. Pause for 30–60 days and they come back on their own schedule.',
      },
      {
        reason: 'missing_feature',
        offer: 'extend-trial',
        rationale: 'If they were waiting on a feature, extending the trial buys time to ship it or route them to a workaround.',
      },
      {
        reason: 'switching',
        offer: 'discount',
        rationale: 'Competitor poaches are the only reliable win-case for a steep discount in SaaS.',
      },
      {
        reason: 'technical',
        offer: 'extend-trial',
        rationale: 'Give support the time window to fix the integration or bug that blocked the customer.',
      },
      {
        reason: 'other',
        offer: 'pause',
        rationale: 'Default to pause. A paused SaaS account reactivates 3–5x more often than a cancelled one.',
      },
    ],
    wcProducts: [
      'WooCommerce Subscriptions + custom plan logic',
      'WP Fusion (Active Campaign, HubSpot)',
      'LicenseSpring or custom license middleware',
    ],
    mathExample: {
      mrr: 40000,
      attemptsPerMonth: 180,
      defaultSaveRate: 0.10,
      optimizedSaveRate: 0.26,
      avgMonthlyValue: 49,
    },
    relatedBlogSlugs: ['pause-vs-discount', 'one-question-rule'],
  },
  {
    slug: 'memberships',
    vertical: 'Membership sites',
    shortLabel: 'Memberships',
    metaTitle: 'Save cancellations on membership sites (WooCommerce)',
    metaDescription:
      'ChurnStop save flows for paid memberships on WooCommerce. Pause for seasonal members, tier-down for price objections, winback email sequence built in.',
    hero: {
      headline: 'Memberships win on pause, not discount.',
      subhead:
        'Member churn is driven by life events and attention budget, not price. Pause converts 2–3x better than discount for memberships because it matches how members actually think about their commitment.',
    },
    businessShape: {
      typicalMrr: '$2k–$80k MRR',
      typicalAov: '$15–$75 per month',
      renewalCadence: 'Monthly with annual upgrade path',
      primaryChurnDrivers: [
        'Busy season — will rejoin next quarter',
        'Goal already met (fitness, course)',
        'Community engagement dropped',
        'Too many overlapping subscriptions',
      ],
    },
    benchmarks: [
      { label: 'Typical save rate', value: '25–35%', source: 'Churnkey 2024 community + membership cohort' },
      { label: 'Pause reactivation', value: '62% within 90 days', source: 'ChurnStop internal (memberships subset)' },
      { label: 'Winback opens', value: '22–28% 7-day', source: 'winback-email-sequences blog' },
    ],
    routingTable: [
      {
        reason: 'not_using',
        offer: 'pause',
        rationale: 'Pause is the dominant save for memberships. 62% of paused members reactivate inside 90 days.',
      },
      {
        reason: 'too_expensive',
        offer: 'tier-down',
        rationale: 'Many memberships have an annual track that is cheaper per month. Move price-sensitive cancellers there.',
      },
      {
        reason: 'missing_feature',
        offer: 'extend-trial',
        rationale: 'If the member joined for a specific goal you have not delivered yet, extend to let the content catch up.',
      },
      {
        reason: 'switching',
        offer: 'discount',
        rationale: 'Competitor-driven switches are rare in memberships; when they happen, a sharp discount is the win-case.',
      },
      {
        reason: 'technical',
        offer: 'extend-trial',
        rationale: 'Members who hit a login or permissions issue need support time, not an offer.',
      },
      {
        reason: 'other',
        offer: 'pause',
        rationale: 'Anything the member will not articulate is usually "I am too busy right now" — default to pause.',
      },
    ],
    wcProducts: [
      'WooCommerce Memberships',
      'Paid Memberships Pro',
      'MemberPress',
      'Restrict Content Pro',
    ],
    mathExample: {
      mrr: 15000,
      attemptsPerMonth: 95,
      defaultSaveRate: 0.12,
      optimizedSaveRate: 0.31,
      avgMonthlyValue: 25,
    },
    relatedBlogSlugs: ['pause-vs-discount', 'winback-email-sequences'],
  },
  {
    slug: 'online-courses',
    vertical: 'Online courses + cohorts',
    shortLabel: 'Online course programs',
    metaTitle: 'Retain course subscribers with a save flow (WooCommerce)',
    metaDescription:
      'Course + cohort programs on WooCommerce. Route "already finished" to pause, "too expensive" to tier-down, "technical" to support. ChurnStop ships the flow.',
    hero: {
      headline: 'Course retention is about sequence, not price.',
      subhead:
        'Course subscribers cancel when their learning sequence ends or stalls — not because they suddenly became price-sensitive. Map "not using" to extend-trial and "missing a feature" to tier-down to an evergreen track.',
    },
    businessShape: {
      typicalMrr: '$4k–$120k MRR',
      typicalAov: '$29–$199 per month',
      renewalCadence: 'Monthly or cohort-based (weekly cohorts land on monthly billing)',
      primaryChurnDrivers: [
        'Finished the primary curriculum',
        'Cohort ended, no obvious next step',
        'Bought for a specific job interview / milestone',
        'Learning pace mismatch (too fast / too slow)',
      ],
    },
    benchmarks: [
      { label: 'Typical save rate', value: '18–28%', source: 'Podia 2023 creator cohort' },
      { label: '60-day winback reactivation', value: '4–8%', source: 'winback-email-sequences blog' },
      { label: 'Pause take-rate', value: '18–22% of saves', source: 'ChurnStop internal' },
    ],
    routingTable: [
      {
        reason: 'not_using',
        offer: 'extend-trial',
        rationale: 'Learners who fell behind come back — give them a free month to catch up rather than losing them to the pause/discount dilemma.',
      },
      {
        reason: 'too_expensive',
        offer: 'tier-down',
        rationale: 'Move to an evergreen / self-paced track instead of the cohort tier. Preserves the account at a lower monthly price.',
      },
      {
        reason: 'missing_feature',
        offer: 'product-swap',
        rationale: 'Swap to a different course in the same library before offering money off.',
      },
      {
        reason: 'switching',
        offer: 'discount',
        rationale: 'If they named a competing course, discount is the correct lever.',
      },
      {
        reason: 'technical',
        offer: 'extend-trial',
        rationale: 'Access issues, dead links, broken video player — let support fix it with the timer paused.',
      },
      {
        reason: 'other',
        offer: 'pause',
        rationale: 'Default to pause. Most "other" cancellations in education are life events, not product decisions.',
      },
    ],
    wcProducts: [
      'LearnDash + WooCommerce Subscriptions',
      'Sensei + WooCommerce Subscriptions',
      'LifterLMS',
      'Tutor LMS Pro',
    ],
    mathExample: {
      mrr: 25000,
      attemptsPerMonth: 140,
      defaultSaveRate: 0.15,
      optimizedSaveRate: 0.27,
      avgMonthlyValue: 49,
    },
    relatedBlogSlugs: ['winback-email-sequences', 'one-question-rule'],
  },
  {
    slug: 'newsletters',
    vertical: 'Paid newsletters',
    shortLabel: 'Paid newsletters',
    metaTitle: 'Save paid newsletter cancellations on WooCommerce',
    metaDescription:
      'Paid newsletters (Substack-style) on WooCommerce Subscriptions. Route "too expensive" to tier-down (free tier), "not using" to pause. Keeps the reader, loses less revenue.',
    hero: {
      headline: 'For paid newsletters, downgrade beats churn.',
      subhead:
        'Newsletter unsubscribes are rarely about the content — they are about attention. Route the cancel flow to a free tier on "too expensive" and a pause on "not using". You keep the reader relationship and the re-upgrade path stays open.',
    },
    businessShape: {
      typicalMrr: '$1k–$30k MRR',
      typicalAov: '$7–$15 per month',
      renewalCadence: 'Monthly or annual',
      primaryChurnDrivers: [
        'Inbox overwhelm',
        'Content drift — topic changed',
        'Annual renewal sticker shock',
        'Career change removed the use case',
      ],
    },
    benchmarks: [
      { label: 'Typical save rate', value: '20–28%', source: 'Substack public churn data 2023' },
      { label: 'Free-tier retention', value: '68% of tier-downs', source: 'ChurnStop internal' },
      { label: 'Annual-to-monthly take-rate', value: '31% of annual cancellers', source: 'Ghost Foundation 2024' },
    ],
    routingTable: [
      {
        reason: 'too_expensive',
        offer: 'tier-down',
        rationale: 'Move them to the free tier. You keep the email and the re-subscribe path stays open.',
      },
      {
        reason: 'not_using',
        offer: 'pause',
        rationale: 'Pause 60 days. Inbox fatigue is the number-one cancel reason for paid newsletters — it passes.',
      },
      {
        reason: 'missing_feature',
        offer: 'product-swap',
        rationale: 'If you publish multiple newsletters, offer the sibling before discounting.',
      },
      {
        reason: 'switching',
        offer: 'discount',
        rationale: 'Competing newsletter (Substack, Beehiiv) is the only reliable discount case.',
      },
      {
        reason: 'technical',
        offer: 'extend-trial',
        rationale: 'Delivery issues (spam folder, misrouted) — extend so support can fix without losing the reader.',
      },
      {
        reason: 'other',
        offer: 'pause',
        rationale: 'Everything else defaults to pause.',
      },
    ],
    wcProducts: [
      'MailPoet + WooCommerce Subscriptions',
      'Newsletter Glue',
      'Custom ACF + WC Subs post-meta gate',
    ],
    mathExample: {
      mrr: 6000,
      attemptsPerMonth: 60,
      defaultSaveRate: 0.14,
      optimizedSaveRate: 0.26,
      avgMonthlyValue: 10,
    },
    relatedBlogSlugs: ['pause-vs-discount', 'one-question-rule'],
  },
  {
    slug: 'replenishment',
    vertical: 'Replenishment commerce',
    shortLabel: 'Replenishment (supplements, coffee, pet food)',
    metaTitle: 'Cancellation save flow for replenishment (WooCommerce)',
    metaDescription:
      'Replenishment subscriptions on WooCommerce — supplements, coffee, pet food. ChurnStop routes "not using" to skip-renewal and "too expensive" to discount for the highest save rates (40–55%).',
    hero: {
      headline: 'Replenishment has the highest save rates — when you route right.',
      subhead:
        'Customers who subscribe to consumables cancel on timing, not intent. A skip-renewal offer converts 40%+ of "not using" cancellations. The product is fine. The cadence is wrong.',
    },
    businessShape: {
      typicalMrr: '$10k–$500k MRR',
      typicalAov: '$25–$80 per shipment',
      renewalCadence: 'Every 30, 45, or 60 days',
      primaryChurnDrivers: [
        'Stockpiled — not using it fast enough',
        'Found the same product cheaper elsewhere',
        'Pet died / health goal changed',
        'Shipping delay eroded trust',
      ],
    },
    benchmarks: [
      { label: 'Typical save rate', value: '40–55%', source: 'Recharge 2023 replenishment cohort' },
      { label: 'Skip-renewal take-rate', value: '38% of "not using" cancellations', source: 'ChurnStop internal' },
      { label: 'Discount-driven saves', value: '21% of "too expensive"', source: 'Churnkey 2024' },
    ],
    routingTable: [
      {
        reason: 'not_using',
        offer: 'skip-renewal',
        rationale: 'This is the killer play. 38% of "not using" cancellers accept a skip and reorder the next cycle.',
      },
      {
        reason: 'too_expensive',
        offer: 'discount',
        rationale: 'Replenishment is price-sensitive. 20% off the next 3 cycles is a strong lever.',
      },
      {
        reason: 'missing_feature',
        offer: 'product-swap',
        rationale: 'Swap to a flavour, size, or formulation the customer may not have tried.',
      },
      {
        reason: 'switching',
        offer: 'discount',
        rationale: 'Price-match the competing brand for one cycle.',
      },
      {
        reason: 'technical',
        offer: 'extend-trial',
        rationale: 'Shipping delay is the typical "technical" in replenishment — extend and let ops fix it.',
      },
      {
        reason: 'other',
        offer: 'pause',
        rationale: 'Default to pause for unclear reasons — includes most life-event cancellations.',
      },
    ],
    wcProducts: [
      'WooCommerce Subscriptions (native)',
      'Subscriptio',
      'SUMO Subscriptions',
      'ReCharge (WooCommerce variant)',
    ],
    mathExample: {
      mrr: 80000,
      attemptsPerMonth: 340,
      defaultSaveRate: 0.28,
      optimizedSaveRate: 0.48,
      avgMonthlyValue: 42,
    },
    relatedBlogSlugs: ['woocommerce-churn-benchmarks', 'pause-vs-discount'],
  },
];

export function getPersona(slug: string): Persona | undefined {
  return personas.find((p) => p.slug === slug);
}

export function personaSlugs(): string[] {
  return personas.map((p) => p.slug);
}
