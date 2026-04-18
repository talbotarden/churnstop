import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { softwareApplicationSchema } from '@/lib/schema/software-application';
import { faqItems, faqPageSchema } from '@/lib/schema/faq';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'ChurnStop pricing: Free on wordpress.org (today via direct download), Starter $79/mo (up to $10k MRR preserved), Growth $199/mo (up to $50k MRR), Agency $399/mo (unlimited). Paid-tier checkout opens after wordpress.org listing approval; join the waitlist now.',
  alternates: { canonical: '/pricing' },
};

type FeatureItem = { text: string; status?: 'coming-soon' };

type Tier = {
  name: string;
  price: string;
  tagline: string;
  features: FeatureItem[];
  cta: string;
  href: string;
  ctaNote?: string;
};

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Direct download today; on wordpress.org once approved',
    features: [
      { text: 'Single-path save flow' },
      { text: 'Discount + pause offers' },
      { text: 'Save count dashboard' },
      { text: 'Click-to-cancel compliance' },
      { text: 'GDPR data export + erase hooks' },
    ],
    cta: 'Download churnstop.zip',
    href: '/downloads/churnstop.zip',
    ctaNote: 'wordpress.org listing pending review',
  },
  {
    name: 'Starter',
    price: '$79/mo',
    tagline: 'Up to $10k MRR preserved / month',
    features: [
      { text: 'Everything in Free' },
      { text: 'Six offer types (discount, pause, skip renewal, tier-down, extend trial, product swap)' },
      { text: 'Conditional branching by cancel reason' },
      { text: 'Save-rate dashboard' },
      { text: '14-day rate-limit window (repeat cancel clicks go direct to cancel)' },
      { text: 'Email support' },
      { text: 'A/B testing', status: 'coming-soon' },
    ],
    cta: 'Join waitlist',
    href: '#waitlist',
    ctaNote: 'Paid checkout opens after wp.org listing',
  },
  {
    name: 'Growth',
    price: '$199/mo',
    tagline: 'Up to $50k MRR preserved / month',
    features: [
      { text: 'Everything in Starter' },
      { text: 'Priority support' },
      { text: 'Cohort LTV analytics', status: 'coming-soon' },
      { text: 'Winback email automation (7/21/60-day sequence)', status: 'coming-soon' },
      { text: 'Customer segmentation', status: 'coming-soon' },
    ],
    cta: 'Join waitlist',
    href: '#waitlist',
    ctaNote: 'Paid checkout opens after wp.org listing',
  },
  {
    name: 'Agency',
    price: '$399/mo',
    tagline: 'Unlimited MRR preserved',
    features: [
      { text: 'Everything in Growth' },
      { text: 'SLA support' },
      { text: 'White-label admin', status: 'coming-soon' },
      { text: 'Multi-site central management', status: 'coming-soon' },
      { text: 'Cross-store benchmarks', status: 'coming-soon' },
    ],
    cta: 'Join waitlist',
    href: '#waitlist',
    ctaNote: 'Paid checkout opens after wp.org listing',
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
          ChurnStop prices from free to $399 per month. The free plugin is available for direct download today; the wordpress.org listing is in review. Paid tiers open for checkout once the wp.org listing is approved and Stripe billing is wired. Join the waitlist and get notified when paid plans go live.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {tiers.map((tier) => (
            <div key={tier.name} className="flex flex-col rounded-lg border border-strong p-6">
              <h2 className="text-xl font-semibold">{tier.name}</h2>
              <div className="mt-2 text-3xl font-bold font-mono">{tier.price}</div>
              <p className="text-sm text-muted-2">{tier.tagline}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {tier.features.map((f) => (
                  <li key={f.text} className="flex flex-wrap items-start gap-1.5">
                    <span className="text-muted-2">-</span>
                    <span className={f.status === 'coming-soon' ? 'text-muted' : ''}>{f.text}</span>
                    {f.status === 'coming-soon' ? (
                      <span className="text-[10px] uppercase tracking-wider text-muted-2 font-medium border border-soft rounded px-1.5 py-0.5 ml-1">
                        Soon
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                className="mt-6 rounded-md bg-ink px-4 py-2 text-center text-white hover:opacity-90 dark:bg-white dark:text-ink"
              >
                {tier.cta}
              </a>
              {tier.ctaNote ? (
                <p className="mt-2 text-[11px] text-muted-2 text-center">{tier.ctaNote}</p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Waitlist anchor */}
        <section id="waitlist" className="mt-20 rounded-xl border border-strong surface p-8 scroll-mt-24">
          <div className="eyebrow">Paid tier waitlist</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tightish">Get notified when paid plans open.</h2>
          <p className="mt-3 text-muted max-w-prose">
            ChurnStop is in pre-launch for paid tiers. While wordpress.org review is pending and Stripe checkout is being wired, the free plugin is fully functional via direct download (<a href="/downloads/churnstop.zip" className="text-accent underline underline-offset-4 hover:no-underline">churnstop.zip</a>) and ships the click-to-cancel compliance guard, discount + pause offers, and the save-rate dashboard.
          </p>
          <p className="mt-4 text-muted max-w-prose">
            To join the paid-tier waitlist, email <a href="mailto:sales@churnstop.org?subject=ChurnStop%20paid%20tier%20waitlist" className="text-accent underline underline-offset-4 hover:no-underline">sales@churnstop.org</a> with your site URL and rough MRR. You will be first in line when Stripe checkout opens, and pre-launch waitlist subscribers get a discount on their first billing period.
          </p>
        </section>

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
