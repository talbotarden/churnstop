import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { softwareApplicationSchema } from '@/lib/schema/software-application';
import { faqItems, faqPageSchema } from '@/lib/schema/faq';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'ChurnStop pricing: Free on wordpress.org, Starter $79/mo (up to $10k MRR preserved), Growth $199/mo (up to $50k MRR), Agency $399/mo (unlimited). 14-day free trial on all paid tiers; save 20% annually.',
  alternates: { canonical: '/pricing' },
};

const tiers = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'On wordpress.org',
    features: [
      'Single-path save flow',
      'Discount + pause offers',
      'Save count dashboard',
      'Click-to-cancel compliance',
      'GDPR data hooks',
    ],
    cta: 'Install from wordpress.org',
    href: 'https://wordpress.org/plugins/churnstop/',
  },
  {
    name: 'Starter',
    price: '$79/mo',
    tagline: 'Up to $10k MRR preserved / month',
    features: [
      'Everything in Free',
      'Conditional branching flows',
      '6 offer types',
      'Save-rate dashboard',
      'A/B testing',
      'Email support',
    ],
    cta: 'Start free trial',
    href: '/checkout?tier=starter',
  },
  {
    name: 'Growth',
    price: '$199/mo',
    tagline: 'Up to $50k MRR preserved / month',
    features: [
      'Everything in Starter',
      'Cohort LTV analytics',
      'Winback automation',
      'Customer segmentation',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: '/checkout?tier=growth',
  },
  {
    name: 'Agency',
    price: '$399/mo',
    tagline: 'Unlimited MRR preserved',
    features: [
      'Everything in Growth',
      'White-label admin',
      'Multi-site central management',
      'Cross-store benchmarks',
      'SLA support',
    ],
    cta: 'Start free trial',
    href: '/checkout?tier=agency',
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd id="ld-software-application" schema={softwareApplicationSchema} />
      <JsonLd id="ld-faq" schema={faqPageSchema} />

      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tightish">Pricing</h1>
        <p className="mt-3 text-muted max-w-prose">
          ChurnStop prices from free to $399 per month. Every paid tier includes a 14-day free trial and saves 20% when billed annually. Cancel any time.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {tiers.map((tier) => (
            <div key={tier.name} className="flex flex-col rounded-lg border border-strong p-6">
              <h2 className="text-xl font-semibold">{tier.name}</h2>
              <div className="mt-2 text-3xl font-bold font-mono">{tier.price}</div>
              <p className="text-sm text-muted-2">{tier.tagline}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {tier.features.map((f) => (
                  <li key={f}>- {f}</li>
                ))}
              </ul>
              <a
                href={tier.href}
                className="mt-6 rounded-md bg-ink px-4 py-2 text-center text-white hover:opacity-90 dark:bg-white dark:text-ink"
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* FAQ - both this UI and faqPageSchema read from the same faqItems */}
        {/* array in lib/schema/faq.ts so they cannot drift. */}
        <section id="faq" className="mt-24 border-t border-soft pt-16">
          <div className="max-w-2xl">
            <div className="eyebrow">Frequently asked</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tightish">Questions merchants ask before installing</h2>
          </div>

          <div className="mt-10 divide-y divide-[color:var(--border)] border-t border-b border-soft">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-left text-[17px] font-medium tracking-tightish marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] text-muted leading-relaxed max-w-prose">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
