import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { buildArticleSchema } from '@/lib/schema/article';
import {
  clickToCancelFaqItems,
  clickToCancelFaqSchema,
} from '@/lib/schema/click-to-cancel-faq';
import { site } from '@/lib/site';

const lastUpdated = '2026-04-18';

export const metadata: Metadata = {
  title: 'FTC click-to-cancel compliance for WooCommerce Subscriptions',
  description:
    'ChurnStop enforces FTC click-to-cancel / ROSCA compliance at the code level. Every save-flow screen keeps a visible one-click cancel link; non-compliant configurations are rejected before save. Fines are up to $50,120 per violation.',
  alternates: { canonical: '/click-to-cancel' },
  openGraph: {
    title: 'ChurnStop - FTC click-to-cancel compliance for WooCommerce',
    description:
      'Compliance enforced at the code level, not documentation. Default safe; non-compliant flows refuse to save.',
    url: `${site.url}/click-to-cancel`,
    type: 'article',
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Click to Cancel', path: '/click-to-cancel' },
]);

const articleSchema = buildArticleSchema({
  title: 'FTC click-to-cancel compliance for WooCommerce Subscriptions',
  description:
    'What the FTC click-to-cancel rule requires, how it applies to WooCommerce Subscriptions stores, what the fines are, and how ChurnStop enforces compliance automatically.',
  slug: 'click-to-cancel',
  publishedAt: '2026-04-18',
  updatedAt: lastUpdated,
  authorName: 'ChurnStop',
  keywords: [
    'click to cancel',
    'ROSCA',
    'FTC negative option rule',
    'WooCommerce Subscriptions compliance',
    'subscription cancellation law',
  ],
});

// Re-target the Article @id to the compliance page route (builder defaults
// to /blog/{slug}; for this page it lives at /click-to-cancel).
articleSchema['@id'] = `${site.url}/click-to-cancel/#article`;
articleSchema.mainEntityOfPage = {
  '@type': 'WebPage',
  '@id': `${site.url}/click-to-cancel`,
};
articleSchema.url = `${site.url}/click-to-cancel`;

const requirements = [
  {
    n: 1,
    title: 'Cancellation must be available online, end-to-end',
    rule:
      'For subscriptions signed up online, the customer must be able to cancel online through a direct mechanism. Forcing a call, an email, or a support form is prohibited.',
    churnstop:
      'ChurnStop runs entirely inside the customer\'s My Account page. The entire save flow, including the final cancel click, happens in a single browser session with no external contact required.',
  },
  {
    n: 2,
    title: 'Cancellation must take no more steps than sign-up',
    rule:
      'If sign-up took two clicks, cancellation must take at most two clicks. Save flows that insert extra steps compared to sign-up fail this test.',
    churnstop:
      'Every ChurnStop save screen keeps a one-click cancellation link visible. From any point in the flow, "No thanks, cancel my subscription" completes cancellation without any additional step or confirmation dialog.',
  },
  {
    n: 3,
    title: 'The cancel option must be as visible as the retain option',
    rule:
      'Hiding or de-emphasising cancellation (small grey text, collapsed menus, buried links) is prohibited. The cancel option must be at least as prominent as the continue-subscription option.',
    churnstop:
      'The plugin renders the cancel link as a first-class UI element on every flow screen. Admin configuration cannot hide it, shrink it, or bury it behind a menu; the compliance validator rejects any settings that would.',
  },
  {
    n: 4,
    title: 'No coercive retention attempts before allowing cancel',
    rule:
      'You may show save offers, but only after the customer has indicated intent to cancel. The offer screen cannot be the only path; the direct cancel link must remain visible.',
    churnstop:
      'Save offers only appear after the customer clicks cancel and selects a reason. Every offer screen carries the cancel link; the customer can decline and complete cancellation at any point with one click.',
  },
  {
    n: 5,
    title: 'Clear confirmation of cancellation status',
    rule:
      'After cancellation, the customer must see a clear confirmation. There must be no ambiguous intermediate state where the customer appears cancelled but is still being billed.',
    churnstop:
      'Cancellation is recorded atomically in a single WC Subs API call. The subscription moves to cancelled status immediately; the customer receives the standard WooCommerce cancellation notice; there is no "pending cancellation" state.',
  },
];

export default function ClickToCancelPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />
      <JsonLd id="ld-article" schema={articleSchema} />
      <JsonLd id="ld-faq" schema={clickToCancelFaqSchema} />

      <article className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Click to Cancel</span>
        </nav>

        <div className="eyebrow">Compliance</div>
        <h1 className="mt-3 text-[40px] lg:text-[56px] leading-[1.05] tracking-tightish font-semibold">
          FTC click-to-cancel compliance for WooCommerce Subscriptions.
        </h1>
        <p className="mt-6 text-[18px] lg:text-[20px] text-muted max-w-[60ch] leading-relaxed">
          ChurnStop enforces FTC click-to-cancel compliance at the code level, not through documentation or policy. Every save-flow screen keeps a visible one-click cancellation link. Non-compliant configurations are rejected before they can be saved. Civil penalties under the amended rule are up to $50,120 per violation per consumer; ChurnStop makes that liability structurally impossible on stores that install it.
        </p>

        <div className="mt-6 text-xs text-muted-2">Last updated {lastUpdated}</div>

        {/* Liability stat strip */}
        <section className="mt-12 grid gap-6 sm:grid-cols-3 border-y border-soft py-10">
          <div>
            <div className="font-mono text-3xl tracking-tight">$50,120</div>
            <div className="mt-2 text-sm text-muted">Maximum federal civil penalty per violation per consumer under the amended FTC Negative Option Rule.</div>
          </div>
          <div>
            <div className="font-mono text-3xl tracking-tight">May 2025</div>
            <div className="mt-2 text-sm text-muted">Effective date of the updated click-to-cancel rule. Applies to any US merchant selling a recurring subscription online.</div>
          </div>
          <div>
            <div className="font-mono text-3xl tracking-tight">0</div>
            <div className="mt-2 text-sm text-muted">Configurations ChurnStop will let you save that violate the rule. The compliance validator rejects non-compliant flows before write.</div>
          </div>
        </section>

        {/* What the rule requires */}
        <section className="mt-20">
          <h2 className="text-[32px] leading-tight tracking-tightish font-semibold">
            What the rule requires, and how ChurnStop enforces each part.
          </h2>
          <p className="mt-4 text-muted max-w-prose">
            The amended rule has five operative requirements for online subscription merchants. Each one maps to a specific enforcement mechanism in the plugin.
          </p>

          <ol className="mt-10 space-y-10">
            {requirements.map((r) => (
              <li key={r.n} className="grid md:grid-cols-[auto_1fr] gap-5">
                <div className="font-mono text-lg text-accent shrink-0">{String(r.n).padStart(2, '0')}</div>
                <div>
                  <h3 className="text-[20px] font-semibold tracking-tightish">{r.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed">
                    <span className="text-muted-2 uppercase tracking-wider text-[10px] block mb-1">What the rule says</span>
                    {r.rule}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed">
                    <span className="text-muted-2 uppercase tracking-wider text-[10px] block mb-1">What ChurnStop does</span>
                    {r.churnstop}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Compliant vs non-compliant flow */}
        <section className="mt-20">
          <h2 className="text-[32px] leading-tight tracking-tightish font-semibold">
            Compliant vs non-compliant save flows.
          </h2>
          <p className="mt-4 text-muted max-w-prose">
            The difference is usually in three places: where the cancel link lives, how many clicks it takes, and whether the offer screen blocks or accompanies the path to cancel.
          </p>

          <div className="mt-8 overflow-hidden rounded-xl border border-strong">
            <table className="w-full text-sm">
              <thead>
                <tr className="surface border-b border-soft">
                  <th className="text-left px-5 py-3 font-medium">Check</th>
                  <th className="text-left px-5 py-3 font-medium">Non-compliant pattern</th>
                  <th className="text-left px-5 py-3 font-medium">ChurnStop pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                <tr>
                  <td className="px-5 py-4 align-top font-medium">Cancel link visibility</td>
                  <td className="px-5 py-4 align-top text-muted">Small grey text at the bottom of a retention offer, or hidden in a dropdown.</td>
                  <td className="px-5 py-4 align-top">First-class UI on every screen. Same visual weight as the "continue" action.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 align-top font-medium">Clicks to complete cancel</td>
                  <td className="px-5 py-4 align-top text-muted">Three or more: click cancel, view offer, confirm, confirm again.</td>
                  <td className="px-5 py-4 align-top">One, from any flow screen.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 align-top font-medium">Cancel path vs offer path</td>
                  <td className="px-5 py-4 align-top text-muted">Offer is the only screen; cancel is hidden behind a subsequent page.</td>
                  <td className="px-5 py-4 align-top">Offer and cancel live on the same screen, side by side.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 align-top font-medium">Support routing</td>
                  <td className="px-5 py-4 align-top text-muted">"Contact support" is the only option for certain cancel reasons.</td>
                  <td className="px-5 py-4 align-top">Support is offered alongside cancel, never instead of.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 align-top font-medium">Post-cancel state</td>
                  <td className="px-5 py-4 align-top text-muted">"Pending cancellation" limbo where billing continues for weeks.</td>
                  <td className="px-5 py-4 align-top">Atomic status change on the single WC Subs API call.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 align-top font-medium">Admin guardrail</td>
                  <td className="px-5 py-4 align-top text-muted">Compliance depends on the merchant not misconfiguring the flow.</td>
                  <td className="px-5 py-4 align-top">Validator refuses to save any configuration that violates the rule.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* The compliance validator */}
        <section className="mt-20">
          <h2 className="text-[32px] leading-tight tracking-tightish font-semibold">
            The compliance validator, in code.
          </h2>
          <p className="mt-4 text-muted max-w-prose">
            ChurnStop ships a <code className="font-mono text-sm">ClickToCancel</code> validator class that inspects every flow configuration at both settings-save time and runtime. If any check fails, the configuration is rejected with a specific violation message.
          </p>

          <div className="mt-8 rounded-xl border border-strong surface p-6 font-mono text-[13px] leading-relaxed overflow-x-auto">
            <div className="text-muted-2">// src/Compliance/ClickToCancel.php (WordPress plugin)</div>
            <div className="mt-2">
              $compliance = new ClickToCancel();<br />
              $violations = $compliance-&gt;validateFlow($payload);<br />
              <br />
              if ( ! empty( $violations ) ) &#123;<br />
              {'    '}return new WP_REST_Response([<br />
              {'        '}&apos;error&apos; =&gt; &apos;Compliance violation&apos;,<br />
              {'        '}&apos;violations&apos; =&gt; $violations,<br />
              {'    '}], 422);<br />
              &#125;
            </div>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed max-w-prose">
            The validator is the single choke point. No settings API call, no admin action, and no runtime flow mutation can bypass it. If the plugin is active, the flows the plugin runs are compliant.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-24 border-t border-soft pt-16">
          <div className="max-w-2xl">
            <div className="eyebrow">Compliance FAQ</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tightish">Common questions from merchants and counsel.</h2>
          </div>

          <div className="mt-10 divide-y divide-[color:var(--border)] border-t border-b border-soft">
            {clickToCancelFaqItems.map((item) => (
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

        {/* CTA band */}
        <section className="mt-24 rounded-xl border border-strong surface px-8 py-10">
          <h2 className="text-2xl font-semibold tracking-tightish">Install the free tier and get compliance by default.</h2>
          <p className="mt-3 text-muted max-w-prose">
            The free ChurnStop plugin on wordpress.org includes the full compliance validator. Paid tiers add branching flows, A/B testing, and analytics - all gated by the same validator.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
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
        </section>

        <footer className="mt-16 text-xs text-muted-2">
          This page explains how ChurnStop implements the federal FTC click-to-cancel rule. It is not legal advice. Merchants subject to stricter state ROSCA analogues, to state-specific auto-renewal laws (California BPC 17600 et seq., New York GBL Section 527-a, and similar), or to bundled-service disclosure requirements should consult counsel before launch.
        </footer>
      </article>
    </>
  );
}
