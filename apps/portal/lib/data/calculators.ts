/**
 * Calculator metadata. Each calculator is an interactive client
 * component under /calculators/[slug]. This file just describes the
 * tool so the hub page and sitemap can enumerate them.
 */

export interface CalculatorMeta {
  slug: string;
  name: string;
  summary: string;
  longDescription: string;
  inputs: string[];
  output: string;
  metaTitle: string;
  metaDescription: string;
}

export const calculators: CalculatorMeta[] = [
  {
    slug: 'churn-rate',
    name: 'Churn rate calculator',
    summary:
      'Compute monthly gross churn from your subscriber counts without having to guess whether to divide by starting or ending customers.',
    longDescription:
      'The most-asked churn question is "did I calculate this right?" This calculator takes the only three numbers you need — starting subscribers, cancellations, and new signups — and returns monthly gross churn with the correct denominator.',
    inputs: ['Starting subscribers', 'Cancellations this month', 'New signups this month'],
    output: 'Monthly gross churn percentage',
    metaTitle: 'Churn rate calculator (monthly gross churn)',
    metaDescription:
      'Free monthly churn rate calculator. Enter starting subscribers and cancellations — returns gross monthly churn with the correct denominator. Used by WooCommerce subscription operators.',
  },
  {
    slug: 'save-rate-impact',
    name: 'Save-rate impact calculator',
    summary:
      'See exactly how much MRR a save flow preserves at different save rates against your cancellation volume.',
    longDescription:
      'Plug in your monthly cancel-click volume and average monthly subscription value. See the preserved MRR across a realistic range of save rates (10%, 20%, 30%, 40%). The output is the number most merchants reach for when weighing whether a save flow is worth installing.',
    inputs: ['Cancel attempts per month', 'Average monthly subscription value', 'Target save rate'],
    output: 'MRR preserved per month + annualised',
    metaTitle: 'Save rate impact calculator — MRR preserved by save flow',
    metaDescription:
      'How much MRR does a cancellation save flow actually preserve? Enter your cancel volume + ARPU — this calculator shows monthly and annual preserved MRR at realistic save rates.',
  },
  {
    slug: 'ltv-lift',
    name: 'LTV lift calculator',
    summary:
      'Reduce monthly churn by X points and see the new customer lifetime value. LTV is a straight function of churn for subscription businesses.',
    longDescription:
      'For a subscription business, lifetime value = ARPU / churn_rate. Cutting churn is the single fastest way to grow LTV. Enter your current churn, the churn reduction you expect, and ARPU; the calculator returns the before/after LTV.',
    inputs: ['Current monthly churn %', 'Expected churn reduction (percentage points)', 'ARPU (monthly)'],
    output: 'LTV before / LTV after',
    metaTitle: 'LTV lift calculator — subscription lifetime value vs churn',
    metaDescription:
      'Reduce monthly churn by 1 point — see the new LTV. Free subscription LTV calculator showing the lift from a small churn reduction. ARPU and churn inputs, before/after LTV output.',
  },
  {
    slug: 'winback-revenue',
    name: 'Winback sequence revenue calculator',
    summary:
      'Estimate the revenue from a 7/21/60-day winback email sequence given your monthly cancel volume.',
    longDescription:
      'Winback sequences typically reactivate 4–8% of cancelled customers. This calculator takes your cancel volume and reactivated-customer LTV and estimates the annual revenue contribution. Defaults come from the winback-email-sequences blog benchmarks.',
    inputs: ['Monthly cancellations', 'Winback reactivation rate', 'Reactivated customer LTV'],
    output: 'Winback-attributable annual revenue',
    metaTitle: 'Winback sequence revenue calculator',
    metaDescription:
      'Estimate annual revenue from a 7/21/60-day winback email sequence. Enter cancel volume + reactivation rate — get the annual revenue contribution.',
  },
];

export function getCalculator(slug: string): CalculatorMeta | undefined {
  return calculators.find((c) => c.slug === slug);
}

export function calculatorSlugs(): string[] {
  return calculators.map((c) => c.slug);
}
