import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { featuresFaqItems } from '@/lib/schema/features-faq';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'ChurnStop features for WooCommerce Subscriptions: six offer types (discount, pause, skip renewal, tier-down, extend trial, product swap), conditional branching by cancel reason, A/B testing, save-rate + MRR-preserved dashboard, cohort LTV analytics, winback email automation, FTC click-to-cancel enforced at the code level.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'ChurnStop features - conditional save flows, A/B testing, analytics, winback',
    description:
      'Full feature breakdown for the WooCommerce Subscriptions save-flow plugin.',
    url: `${site.url}/features`,
    type: 'website',
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Features', path: '/features' },
]);

const featuresFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${site.url}/features/#faq`,
  mainEntity: featuresFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

type Bullet = string | { text: string; status: 'coming-soon' };

type Pillar = {
  slug: string;
  eyebrow: string;
  title: string;
  oneLine: string;
  body: string;
  bullets: Bullet[];
  status?: 'coming-soon';
  learnMore?: { label: string; href: string };
};

const pillars: Pillar[] = [
  {
    slug: 'conditional-flows',
    eyebrow: '01',
    title: 'Conditional save flows',
    oneLine:
      'Six offer types. Routed automatically by cancel reason. Applied via native WooCommerce Subscriptions APIs, not workarounds.',
    body: 'A single required question - why are you cancelling - routes the customer to the offer most likely to save them. Price-sensitive reasons get a percent-off discount for the next N renewals. Busy-customer reasons get a 30- or 60-day pause. Switcher reasons get a tier-down or price match. Technical issues route to support rather than an offer, per FTC rules. The mapping is editable from the admin UI; the free tier ships a sensible default.',
    bullets: [
      'Discount: percent off the next 1-12 renewals',
      'Pause: subscription on-hold for 15, 30, 60, or 90 days',
      'Skip renewal: advance next_payment by one billing interval',
      'Tier-down: move the subscription to a cheaper product variant',
      'Extend trial: add days to an active trial period',
      'Product swap: switch to a different subscription product at the same or lower price',
    ],
  },
  {
    slug: 'ab-testing',
    eyebrow: '02',
    title: 'A/B testing flows and offers',
    status: 'coming-soon',
    oneLine:
      'Test different offer amounts, different question wording, different offer ordering. Hold the winner.',
    body: 'The A/B testing engine will randomly assign cancel attempts to flow variants, record which variant the customer saw, and report which variant beats the others with statistical significance. Minimum recommended sample is 200 attempts per variant; most stores reach that in 2-6 weeks. When a variant wins decisively (>95% confidence), ChurnStop will suggest promoting it to the default flow. Schema tables for variants and assignments ship in the plugin today; the runtime that reads and writes them lands in a future release.',
    bullets: [
      'Randomized variant assignment at the cancellation-event level',
      'Sticky per subscriber: same subscriber always sees the same variant within a test',
      'Variant-level save rate, MRR preserved, and revenue-per-attempt',
      'Significance calculated automatically; no stats knowledge required',
      'Winning variant can be promoted to default or kept as a holdout',
    ],
  },
  {
    slug: 'analytics',
    eyebrow: '03',
    title: 'Save-rate and MRR-preserved analytics',
    oneLine:
      'One dashboard. Three numbers at the top.',
    body: 'The dashboard leads with MRR preserved this month - the dollar figure that justifies the subscription. Underneath: save rate as a percentage, cancellation attempts in the period, breakdown by cancel reason, breakdown by offer accepted, week-over-week trend line, and the event log with filter-by-status plus a running MRR-preserved-in-view total. Cohort LTV is in the roadmap for Growth tier; the supporting schema columns (monthly_value_cents, resolved_at) are already captured on every event.',
    bullets: [
      'MRR preserved this month (the headline dollar figure)',
      'Save rate: % of cancel attempts resolved without cancellation',
      'Cancel reason mix: which reasons are rising, which are falling',
      'Offer performance: which offer type wins by reason bucket',
      { text: 'Cohort LTV (Growth+): 12-month revenue from each saved customer', status: 'coming-soon' },
      'Event log with status filter and running MRR-preserved-in-view total',
    ],
  },
  {
    slug: 'winback',
    eyebrow: '04',
    title: 'Winback email automation',
    status: 'coming-soon',
    oneLine:
      'For the customers who cancel despite the offer. Send a sequence, not a single email.',
    body: 'Winback will run on Growth and above. When a customer cancels, ChurnStop will queue a configurable sequence - a personal check-in, a product-update nudge, a discount bounce-back - spaced 7, 21, and 60 days after cancellation. Emails will send through your existing transactional provider (Postmark, SES, SendGrid) via a WordPress filter; ChurnStop does not route mail through its own servers. The backend worker for the sequence lands with the paid-tier checkout launch.',
    bullets: [
      'Three starter templates plus unlimited custom sequences',
      'Trigger on cancellation reason or offer type declined',
      'Stop-rules: already reactivated, unsubscribed, on a do-not-contact list',
      'Per-sequence save rate tracked in the main dashboard',
      'Uses your transactional email provider; mail never transits ChurnStop servers',
    ],
  },
  {
    slug: 'compliance',
    eyebrow: '05',
    title: 'FTC click-to-cancel compliance, at the code level',
    oneLine:
      'Compliance is enforced in the plugin, not in documentation. Non-compliant configurations refuse to save.',
    body: 'Every save-flow screen keeps a visible one-click cancellation link. The ClickToCancel validator inspects configurations at save time and rejects any flow that would hide the cancel path, add extra steps, or force support contact. Civil penalties for violations are up to $50,120 per consumer; ChurnStop removes the possibility of that liability structurally.',
    bullets: [
      'One-click cancel link on every flow screen',
      'Save-time validator blocks non-compliant configurations',
      'Atomic cancellation (no "pending cancellation" billing limbo)',
      'Rate-limited offers (at most one flow per 14-day window by default)',
      'Audit log of every flow change for compliance review',
    ],
    learnMore: { label: 'How the validator works', href: '/click-to-cancel' },
  },
  {
    slug: 'woocommerce-native',
    eyebrow: '06',
    title: 'WooCommerce-native, not a bolt-on',
    oneLine:
      'Uses WC Subs APIs for coupons, pauses, and renewal shifts. Works with your existing store structure.',
    body: 'ChurnStop does not duplicate WooCommerce Subscriptions logic. Discounts issue actual WC Coupons. Pauses use the native on-hold status and update next_payment via WC Subs date helpers. Tier-downs call the supported subscription-switch APIs. The plugin refuses to modify WC Subs core and falls back cleanly if a required hook is missing.',
    bullets: [
      'Requires WooCommerce 8.0+ and WooCommerce Subscriptions 4.0+',
      'PHP 7.4 minimum, WordPress 6.0 minimum',
      'No modifications to WC Subs core or database',
      'Custom tables (not post meta) for cancellation events and A/B assignments',
      'GPL-2.0-or-later, open source on GitHub',
    ],
  },
];

const stats = [
  { value: '6', label: 'Offer types. Discount, pause, skip renewal, tier-down, extend trial, product swap.' },
  { value: '1', label: 'Required question. Every additional question drops save rate by 6.7% (Churnkey data).' },
  { value: '0', label: 'Non-compliant configurations ChurnStop will let you save. Validator rejects before write.' },
  { value: '14 days', label: 'Default rate-limit window. Repeat cancel clicks go direct to one-click cancel.' },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />
      <JsonLd id="ld-faq" schema={featuresFaqSchema} />

      <main>
        {/* Hero */}
        <section className="border-b border-soft">
          <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-24 lg:pb-20">
            <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
              <span aria-hidden className="px-2">/</span>
              <span>Features</span>
            </nav>

            <div className="eyebrow">Features</div>
            <h1 className="mt-3 text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.02] tracking-tightish font-semibold max-w-[18ch]">
              What ChurnStop does, in six parts.
            </h1>
            <p className="mt-6 text-[18px] lg:text-[20px] text-muted max-w-[62ch] leading-relaxed">
              ChurnStop intercepts WooCommerce Subscriptions cancellations with a conditional save flow built on native WC Subs APIs. Six offer types, A/B testing, analytics that lead with MRR preserved, winback email automation, and FTC click-to-cancel compliance enforced at the code level - not in documentation.
            </p>

            {/* Jump nav */}
            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {pillars.map((p) => (
                <a key={p.slug} href={`#${p.slug}`} className="hover:text-[var(--fg)] transition-colors">
                  {p.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="surface border-b border-soft">
          <div className="mx-auto max-w-7xl px-6 py-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-3xl tracking-tight">{s.value}</div>
                <div className="mt-2 text-sm text-muted max-w-[32ch]">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pillar sections */}
        <div className="mx-auto max-w-5xl px-6 py-20 lg:py-28 space-y-28">
          {pillars.map((p) => (
            <section key={p.slug} id={p.slug} className="scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="eyebrow font-mono tracking-widest">{p.eyebrow}</div>
                {p.status === 'coming-soon' ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-2 font-medium border border-soft rounded px-1.5 py-0.5">
                    Coming soon
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold max-w-[20ch]">
                {p.title}
              </h2>
              <p className="mt-5 text-[17px] lg:text-[18px] text-muted max-w-prose leading-relaxed font-medium">
                {p.oneLine}
              </p>
              <p className="mt-5 text-[15px] lg:text-[16px] text-muted max-w-prose leading-relaxed">
                {p.body}
              </p>

              <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[15px]">
                {p.bullets.map((b) => {
                  const text = typeof b === 'string' ? b : b.text;
                  const isSoon = typeof b !== 'string' && b.status === 'coming-soon';
                  return (
                    <li key={text} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span className={`leading-relaxed ${isSoon ? 'text-muted' : ''}`}>
                        {text}
                        {isSoon ? (
                          <span className="ml-2 text-[9px] uppercase tracking-wider text-muted-2 font-medium border border-soft rounded px-1 py-px align-middle">
                            Soon
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {p.learnMore ? (
                <div className="mt-8">
                  <Link
                    href={p.learnMore.href}
                    className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline underline-offset-4"
                  >
                    {p.learnMore.label}
                    <span aria-hidden>-&gt;</span>
                  </Link>
                </div>
              ) : null}
            </section>
          ))}
        </div>

        {/* FAQ */}
        <section className="border-t border-soft">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <div className="eyebrow">Feature questions</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tightish">
              What merchants ask before installing.
            </h2>

            <div className="mt-10 divide-y divide-[color:var(--border)] border-t border-b border-soft">
              {featuresFaqItems.map((item) => (
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
          </div>
        </section>

        {/* CTA band */}
        <section className="border-t border-soft">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="rounded-xl border border-strong surface px-8 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tightish max-w-[22ch]">
                  Install the free tier. Upgrade when you see MRR preserved.
                </h2>
                <p className="mt-3 text-muted max-w-prose">
                  The free tier on wordpress.org includes the full compliance validator, discount and pause offers, and the save count dashboard. Paid tiers add branching flows, A/B testing, and analytics.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={site.ctas.installFree.href}
                  className="inline-flex h-11 items-center rounded-md bg-ink text-white px-5 text-sm font-medium hover:opacity-90 transition-opacity dark:bg-white dark:text-ink"
                >
                  {site.ctas.installFree.label}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center rounded-md border border-strong px-5 text-sm font-medium hover:bg-[var(--bg-elev)] transition-colors"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
