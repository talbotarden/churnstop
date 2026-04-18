// Features-specific FAQs. Questions are feature-intent ("can it do X")
// rather than price or compliance. Separate from pricing FAQ and
// click-to-cancel FAQ so each page ships only the questions relevant
// to that page.

import type { FaqItem } from './faq';

export const featuresFaqItems: FaqItem[] = [
  {
    question: 'Which cancellation offer types does ChurnStop support?',
    answer:
      'Six offer types, all applied via native WooCommerce Subscriptions APIs: percent-off discount for N renewals, pause the subscription for a fixed number of days, skip the next renewal, tier-down to a cheaper plan, extend an active trial, and product-swap to a different subscription product. The free tier includes discount and pause; Starter and above unlock all six.',
  },
  {
    question: 'How does conditional branching work?',
    answer:
      'Every cancel attempt begins with a single required question - the cancellation reason. Based on the answer, ChurnStop routes to a different offer: price-sensitive reasons route to a discount, busy-customer reasons route to a pause, technical-issue reasons route to support rather than an offer, switcher reasons route to a price match. Merchants edit the mapping from the admin UI; the free tier ships a sensible default mapping.',
  },
  {
    question: 'Can I A/B test different save flows?',
    answer:
      'Yes, on Starter and above. The A/B testing engine randomly assigns cancellation attempts to variants of the flow (different offer amounts, different survey wording, different offer order), records outcomes, and surfaces statistical significance when one variant reliably beats the others. Minimum recommended sample per variant is 200 cancellation attempts; most stores hit that in 2-6 weeks.',
  },
  {
    question: 'What does the dashboard actually report?',
    answer:
      'The admin dashboard shows three numbers at the top of the page: MRR preserved this month (in dollars), save rate as a percentage, and total cancellation attempts. Below that: breakdown by cancellation reason, breakdown by offer accepted, week-over-week trend line, and the top five flows by save rate. Growth tier adds cohort LTV - how much each saved customer is worth over the following 12 months.',
  },
  {
    question: 'Does ChurnStop send any email?',
    answer:
      'On Starter: no - email is not part of the cancellation save flow. On Growth and above: yes, the winback email automation sends a sequence to customers who cancelled despite the offer. The sequence is configurable from the admin UI; ChurnStop ships three templates (discount bounce-back, product update, personal check-in) and lets you add your own. Winback emails send through your existing transactional email provider via a WordPress filter; they do not route through ChurnStop servers.',
  },
  {
    question: 'Does ChurnStop work with bundled or multi-product subscriptions?',
    answer:
      'Yes. The cancel flow runs at the subscription level, not the product level. If a single WooCommerce Subscriptions record contains multiple line items, a cancel click triggers one ChurnStop flow that can offer to pause or downgrade the entire subscription. Per-line-item cancellation is supported where WC Subs supports it.',
  },
  {
    question: 'What happens if a customer cancels the same subscription twice in quick succession?',
    answer:
      'ChurnStop rate-limits save offers per subscriber. By default the flow is shown at most once per 14-day window; repeat cancel clicks inside that window skip the offer and go directly to the one-click cancel confirmation. This prevents the flow from becoming harassment and keeps the plugin click-to-cancel compliant. The window is configurable per store from 0 (every attempt shows the offer) to 90 days.',
  },
  {
    question: 'Is there a webhook or API so I can pipe save events into my own analytics?',
    answer:
      'Yes. Every cancellation event (reason, offer shown, outcome, monthly value) is available through a WordPress action hook (churnstop_cancellation_recorded) and a REST endpoint (/wp-json/churnstop/v1/events). Most customers pipe these into Segment, Mixpanel, or a custom warehouse. The payload schema is stable and versioned.',
  },
];
