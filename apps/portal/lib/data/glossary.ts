/**
 * Glossary data. Each term is a programmatic SEO page at
 * /glossary/[slug]. The unique value per page is: precise definition,
 * formula (where applicable), worked example using realistic WooCommerce
 * subscription numbers, related terms, and related blog posts.
 *
 * Definitions are written as short, practical answers rather than
 * encyclopedic walls of text. Every term has either a formula, a
 * worked example, or both.
 */

export interface GlossaryTerm {
  slug: string;
  term: string;
  shortDefinition: string;
  longDefinition: string;
  formula?: string;
  example?: string;
  relatedTerms: string[];
  relatedBlogSlugs: string[];
  alsoKnownAs?: string[];
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'churn-rate',
    term: 'Churn rate',
    shortDefinition:
      'The percentage of subscribers who cancel in a given period. Usually reported as a monthly percentage.',
    longDefinition:
      'Churn rate measures subscription loss. It is the single most referenced retention metric and the most frequently calculated wrong. The right denominator is the customers who could have cancelled in the period — not the end-of-period count. Dividing by the ending count artificially lowers the number, which hides problems from founders.',
    formula: 'monthly_churn = cancellations_in_month / subscribers_at_start_of_month',
    example:
      'A store starts March with 1,200 subscribers and loses 60 to cancellation during the month. Monthly churn = 60 / 1,200 = 5%. If the store gained 150 new subscribers that same month, the churn rate is still 5% — you never put new subscribers in the denominator.',
    relatedTerms: ['save-rate', 'voluntary-churn', 'involuntary-churn', 'net-revenue-retention'],
    relatedBlogSlugs: ['woocommerce-churn-benchmarks'],
    alsoKnownAs: ['Attrition rate', 'Cancellation rate'],
  },
  {
    slug: 'save-rate',
    term: 'Save rate',
    shortDefinition:
      'The percentage of cancellation attempts that a save flow keeps as active subscribers.',
    longDefinition:
      'Save rate is the yield of your cancellation flow. It should be measured on customers who clicked cancel and entered the flow, not on every customer in the base. A save rate above 25% is good; above 40% starts to look suspicious (often the flow is obstructing cancellation, which is a click-to-cancel compliance risk, not an improvement).',
    formula: 'save_rate = cancellations_saved / cancellation_attempts_in_flow',
    example:
      'In April, 200 customers clicked cancel and ChurnStop showed them a save flow. 58 accepted an offer (discount, pause, skip, etc.) and remained active. Save rate = 58 / 200 = 29%.',
    relatedTerms: ['churn-rate', 'cancellation-flow', 'click-to-cancel'],
    relatedBlogSlugs: ['pause-vs-discount', 'one-question-rule'],
  },
  {
    slug: 'involuntary-churn',
    term: 'Involuntary churn',
    shortDefinition:
      'Subscribers who lose access because of payment failures — expired cards, insufficient funds, chargebacks — not a deliberate cancel.',
    longDefinition:
      'Involuntary churn is usually 20–40% of total churn and is entirely addressable with dunning: retry failed charges, update card credentials via Stripe or Braintree account updater, and send a recover email sequence. A cancellation save flow does not reduce involuntary churn — it needs a separate dunning tool or built-in WooCommerce Subscriptions retry logic.',
    example:
      'A store with 5% monthly gross churn finds, on audit, that 1.5 percentage points come from declined renewal charges. That is involuntary churn. Fixing dunning before tuning a save flow is the correct order of operations.',
    relatedTerms: ['voluntary-churn', 'churn-rate'],
    relatedBlogSlugs: ['woocommerce-churn-benchmarks'],
    alsoKnownAs: ['Passive churn', 'Delinquent churn'],
  },
  {
    slug: 'voluntary-churn',
    term: 'Voluntary churn',
    shortDefinition:
      'Subscribers who intentionally cancel. This is what a save flow targets.',
    longDefinition:
      'Voluntary churn is a customer decision — they clicked cancel because of price, fit, life changes, or a competing product. Only voluntary churn is addressable by a cancellation save flow. Reducing voluntary churn by 20% (from 5% to 4% monthly) roughly doubles LTV; reducing it by 30% nearly triples LTV.',
    example:
      'A WooCommerce store has 8% monthly gross churn. 2 points are involuntary (payment failures) and 6 points are voluntary. A save flow that catches 25% of voluntary cancellations brings voluntary churn from 6% to 4.5% and total churn from 8% to 6.5%.',
    relatedTerms: ['involuntary-churn', 'save-rate', 'cancellation-flow'],
    relatedBlogSlugs: ['pause-vs-discount'],
    alsoKnownAs: ['Active churn'],
  },
  {
    slug: 'cancellation-flow',
    term: 'Cancellation flow',
    shortDefinition:
      'The UI sequence a subscriber goes through when they click cancel — survey, offer, confirm, cancel.',
    longDefinition:
      'A well-designed cancellation flow does three things: (1) asks one question about why the customer is leaving, (2) routes to a targeted offer based on the answer, (3) allows a single-click cancel at any step. Flows that require more than one required question violate the FTC click-to-cancel rule and destroy save rate — Churnkey data shows each extra required question drops save rate by ~6.7%.',
    relatedTerms: ['save-rate', 'click-to-cancel', 'cancel-reason'],
    relatedBlogSlugs: ['one-question-rule', 'click-to-cancel-rule-explained'],
    alsoKnownAs: ['Save flow', 'Cancel deflection', 'Win-back flow'],
  },
  {
    slug: 'click-to-cancel',
    term: 'Click to cancel',
    shortDefinition:
      'The FTC rule (effective May 2025) requiring subscription cancellation to be as easy as signup. Applies to US businesses.',
    longDefinition:
      'The FTC "Negative Option Rule" (often called click-to-cancel) requires that cancelling a subscription be at least as simple as starting it. If signup was online, cancel must be online. The rule prohibits mandatory phone calls to cancel, hidden cancel buttons, required exit interviews, and cancel flows that loop back to sales. A compliant save flow shows offers but always allows a single-click cancel on every step.',
    example:
      'A cancel flow that shows three offers, each requiring the customer to click "No thanks" before reaching the cancel button, is non-compliant. A flow that shows each offer alongside a visible "Cancel anyway" button on the same screen is compliant.',
    relatedTerms: ['cancellation-flow', 'rosca'],
    relatedBlogSlugs: ['click-to-cancel-rule-explained'],
    alsoKnownAs: ['Negative Option Rule', 'FTC click-to-cancel'],
  },
  {
    slug: 'net-revenue-retention',
    term: 'Net revenue retention',
    shortDefinition:
      'Revenue from the cohort at the end of the period divided by revenue from the same cohort at the start. Includes expansion + churn.',
    longDefinition:
      'NRR is the metric that separates healthy subscription businesses from treadmill ones. NRR above 100% means your existing customers generate more revenue each month than they did at signup (through upgrades, add-ons, seat growth) — you grow even without new customers. Best-in-class SaaS NRR is 110–130%; WooCommerce replenishment stores often hit 95–105% via upsells and box size upgrades.',
    formula: 'NRR = (starting_mrr + expansion - churn - contraction) / starting_mrr',
    example:
      'A cohort of March-2024 subscribers generated $10,000 MRR at signup. One year later, the same cohort generates $9,400 MRR ($1,100 from expansion upgrades, $1,700 from churn and downgrades). NRR = ($10,000 + $1,100 - $1,700) / $10,000 = 94%.',
    relatedTerms: ['mrr', 'churn-rate', 'cohort-retention'],
    relatedBlogSlugs: [],
    alsoKnownAs: ['NRR', 'Dollar retention'],
  },
  {
    slug: 'mrr',
    term: 'MRR (monthly recurring revenue)',
    shortDefinition:
      'The monthly-normalised recurring revenue of a subscription business at a point in time.',
    longDefinition:
      'MRR is the base unit of a subscription business. Annual plans are divided by 12 to normalise. One-time upsells are excluded. MRR changes through new signups (new MRR), expansion (upgrades, add-ons), contraction (downgrades), and churn (cancellations). The four MRR deltas are often called "the 4 Rs" — recruit, retain, raise, reactivate.',
    formula: 'MRR = sum(active_subscription_monthly_value)',
    example:
      'A WooCommerce store has 400 active subscriptions: 300 at $29/mo, 80 at $49/mo, and 20 annual plans at $500/yr. Annual plans contribute $500 / 12 = $41.67/mo each. MRR = (300 × 29) + (80 × 49) + (20 × 41.67) = $8,700 + $3,920 + $833 = $13,453.',
    relatedTerms: ['net-revenue-retention', 'churn-rate'],
    relatedBlogSlugs: ['woocommerce-churn-benchmarks'],
    alsoKnownAs: ['Monthly recurring revenue'],
  },
  {
    slug: 'cohort-retention',
    term: 'Cohort retention',
    shortDefinition:
      'The percentage of customers who joined in the same period (usually month) that are still active N months later.',
    longDefinition:
      'Cohort retention answers "of the customers who signed up in March, how many are still here in June?" It separates real product-market fit from top-of-funnel noise. A cohort curve that flattens out after month 3 — with the flat level above 60% — is a healthy sign. A curve that keeps declining means your product has not found its long-term value yet.',
    formula: 'cohort_retention(n) = active_subscribers_from_cohort_at_month_n / cohort_size_at_month_0',
    example:
      'March 2025 sign-ups = 100 customers. In June 2025, 65 are still active. Three-month cohort retention = 65 / 100 = 65%.',
    relatedTerms: ['churn-rate', 'net-revenue-retention'],
    relatedBlogSlugs: ['woocommerce-churn-benchmarks'],
  },
  {
    slug: 'winback',
    term: 'Winback',
    shortDefinition:
      'An email sequence (and sometimes offer) targeting customers who already cancelled, to bring them back as active subscribers.',
    longDefinition:
      'A winback sequence is the last save opportunity. Standard timing is 7, 21, and 60 days after cancellation. The 7-day email acknowledges the cancel and asks for feedback. The 21-day email offers a discount to return. The 60-day email is a final, no-pressure check-in. Typical reactivation from a winback sequence is 4–8% of the cancelled cohort.',
    example:
      'A store cancels 300 subscriptions in Q2. The winback sequence fires on each: 6% reactivate within 90 days of sending. That is 18 recovered customers, which at $35 LTV-per-save-month is ~$630 preserved MRR — and the cost is a few template emails.',
    relatedTerms: ['save-rate', 'cancellation-flow'],
    relatedBlogSlugs: ['winback-email-sequences'],
    alsoKnownAs: ['Win-back', 'Reactivation'],
  },
  {
    slug: 'rosca',
    term: 'ROSCA',
    shortDefinition:
      'Restore Online Shoppers\' Confidence Act. The 2010 US federal law governing online subscription consent and disclosure.',
    longDefinition:
      'ROSCA requires clear disclosure of subscription terms before charging, express informed consent at signup, and a simple mechanism to cancel. It applies to any US-facing online subscription. The FTC\'s 2025 click-to-cancel rule extends ROSCA with prescriptive rules on how "simple to cancel" is measured. ChurnStop\'s compliance guard enforces the five rule checks at runtime: single-click cancel button, cancel path length, no forced phone calls, no required surveys, no sales loops.',
    relatedTerms: ['click-to-cancel', 'cancellation-flow'],
    relatedBlogSlugs: ['click-to-cancel-rule-explained'],
    alsoKnownAs: ['Restore Online Shoppers\' Confidence Act'],
  },
  {
    slug: 'ftc-click-to-cancel',
    term: 'FTC click-to-cancel rule',
    shortDefinition:
      'The 2025 Federal Trade Commission rule making it unlawful to obstruct subscription cancellation for US consumers.',
    longDefinition:
      'Effective May 2025, the rule requires: cancellation at least as easy as signup, plain-language disclosure of recurring charges, and prohibition of misleading terms. Non-compliance can trigger FTC enforcement, state attorney general actions, and private suits. ChurnStop validates the five most cited rule checks on every settings save and refuses to store a flow configuration that would obstruct cancel — the check is runtime, not just documentation.',
    relatedTerms: ['click-to-cancel', 'rosca'],
    relatedBlogSlugs: ['click-to-cancel-rule-explained'],
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}

export function glossarySlugs(): string[] {
  return glossaryTerms.map((t) => t.slug);
}
