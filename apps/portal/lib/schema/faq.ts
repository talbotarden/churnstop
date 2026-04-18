// FAQPage JSON-LD plus the canonical FAQ content. Both the visible FAQ section
// and the schema payload read from `faqItems` so they can never drift. Add or
// edit a question here and both the UI and the structured data update in the
// same commit.
//
// Rules enforced by the ai-search-optimizer skill:
//   - Every answer opens with the direct answer, no throat-clearing.
//   - Factual only. No marketing hype.
//   - Answers that state numbers (pricing, thresholds, version requirements)
//     must match the source of truth in `/lib/site.ts` and the pricing page.

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'What is ChurnStop?',
    answer:
      'ChurnStop is a WordPress plugin for WooCommerce Subscriptions that intercepts subscription cancellations with a conditional save flow. When a subscriber clicks cancel, ChurnStop asks why and shows a targeted offer based on the reason - a discount for price-sensitive customers, a pause for busy ones, a price match for switchers. If the customer declines, they complete cancellation in one click.',
  },
  {
    question: 'How much does ChurnStop cost?',
    answer:
      'ChurnStop has four tiers: Free on wordpress.org, Starter at $79/month (preserves up to $10k MRR), Growth at $199/month (up to $50k MRR, adds cohort analytics and winback emails), and Agency at $399/month (unlimited MRR, white-label and multi-site). All paid tiers include a 14-day free trial and save 20% when billed annually.',
  },
  {
    question: 'What does the free tier include?',
    answer:
      'The free tier includes a single-path save flow, discount and pause offers, a save count dashboard, FTC click-to-cancel compliance enforcement, and GDPR data hooks. It runs entirely locally and never makes outbound HTTP calls to ChurnStop servers. Download it from wordpress.org/plugins/churnstop.',
  },
  {
    question: 'Is ChurnStop click-to-cancel compliant?',
    answer:
      'Yes. FTC click-to-cancel compliance is enforced by design, not by configuration. Every save-flow screen keeps a "No thanks, cancel my subscription" link visible and one click from completing cancellation. The plugin refuses to save settings that would violate ROSCA cancellation rules and flags non-compliant configurations at runtime.',
  },
  {
    question: 'Does ChurnStop work with WooCommerce Subscriptions?',
    answer:
      'Yes - ChurnStop requires WooCommerce Subscriptions 4.0 or newer, WooCommerce 8.0 or newer, WordPress 6.0 or newer, and PHP 7.4 or newer. It uses native WooCommerce Subscriptions APIs for coupons, pauses, and renewal shifts. It does not modify WooCommerce Subscriptions core.',
  },
  {
    question: 'What save rate should I expect?',
    answer:
      'Save-flow tools report a 34% average save rate across customers (Churnkey 2024). ProsperStack reports 10-39% churn reduction across SaaS and e-commerce customers. Actual save rate depends on cancel-reason mix, offer quality, and traffic volume. A WooCommerce store doing $20k MRR with 5% monthly churn that achieves a 30% save rate preserves around $300 per month, compounding.',
  },
  {
    question: 'How is ChurnStop different from Churnkey or ProsperStack?',
    answer:
      'Churnkey and ProsperStack are primarily SaaS and Shopify tools priced from $200-500 per month and up; neither has a WooCommerce plugin. ChurnStop brings the same save-flow structure (conditional offers, A/B testing, save-rate dashboard) to WooCommerce Subscriptions natively, priced from free to $399/month. For WooCommerce merchants specifically, ChurnStop is typically a third of the cost with tighter integration.',
  },
  {
    question: 'Can I try it before paying?',
    answer:
      'Yes. The free tier on wordpress.org ships the core save-flow permanently. Paid tiers include a 14-day free trial with no card required to start. Cancel at any time during the trial with no charge.',
  },
  {
    question: 'What happens if the ChurnStop backend is unavailable?',
    answer:
      'The save flow keeps working. The free tier runs entirely locally and never calls the backend. Paid tiers fall back to local defaults if the license or benchmark endpoints are unreachable, so an outage at ChurnStop does not break customer cancellation flows on your site.',
  },
  {
    question: 'Is my subscriber data shared with ChurnStop?',
    answer:
      'The free tier shares nothing. Paid tiers share only aggregated, anonymized cancellation outcomes (reason bucket, offer shown, accepted or declined, monthly value) for cross-store benchmarks. Individual customer identities and email addresses stay in your WooCommerce database. GDPR erasure hooks are provided so customer data removal requests propagate to ChurnStop benchmarks.',
  },
];

// Build the JSON-LD from the same faqItems array.
export const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://churnstop.org/pricing/#faq',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};
