import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'ChurnStop is a save-flow plugin for WooCommerce Subscriptions priced for small and mid-market stores. Built because the existing save-flow tools (Churnkey, ProsperStack) do not support WooCommerce and are priced for SaaS enterprise.',
  alternates: { canonical: '/about' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
]);

export default function AboutPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>About</span>
        </nav>

        <div className="eyebrow">About ChurnStop</div>
        <h1 className="mt-3 text-[40px] lg:text-[52px] leading-[1.05] tracking-tightish font-semibold max-w-[20ch]">
          Built for WooCommerce stores that bill monthly and want to keep more of them.
        </h1>

        <p className="mt-8 text-[17px] text-muted leading-relaxed">
          ChurnStop exists because WooCommerce Subscriptions stores have no equivalent of the save-flow tools that SaaS and Shopify merchants have had for years. Churnkey and ProsperStack dominate that category. Both are priced from $200 to $500 per month and up. Neither has a WooCommerce plugin.
        </p>

        <p className="mt-5 text-[17px] text-muted leading-relaxed">
          For a WooCommerce store doing $20k monthly recurring revenue, that price point is out of reach. The churn problem is identical. The tooling gap is unjustifiable. ChurnStop fills it: the same rigor - conditional flows by cancel reason, A/B testing, save-rate and MRR-preserved dashboards, cohort analytics - native to WooCommerce Subscriptions, priced for small and mid-market stores, with FTC click-to-cancel compliance enforced by code rather than by policy.
        </p>

        <h2 className="mt-14 text-[24px] tracking-tightish font-semibold">Product philosophy</h2>

        <ol className="mt-6 space-y-6 text-[16px] leading-relaxed text-muted max-w-prose list-decimal pl-6 marker:text-muted-2">
          <li>
            <strong className="text-[var(--fg)] font-semibold">Measurable MRR preserved beats feature-count marketing.</strong> The admin dashboard shows one dollar figure every Monday. That number is what justifies the subscription. If ChurnStop is not visibly preserving more MRR than it costs, it is not working for that store.
          </li>
          <li>
            <strong className="text-[var(--fg)] font-semibold">Compliance first.</strong> Every feature ships behind the <Link href="/click-to-cancel" className="text-accent underline underline-offset-4 hover:no-underline">click-to-cancel guard</Link>. Non-compliant configurations cannot be saved. Federal penalties are up to $50,120 per violation per consumer; that liability should be structurally impossible, not merely discouraged.
          </li>
          <li>
            <strong className="text-[var(--fg)] font-semibold">Native integration over bolt-on.</strong> ChurnStop uses WooCommerce Subscriptions APIs the way they are intended. Discounts issue actual WC Coupons. Pauses use the native on-hold status. Nothing is hacked together and nothing modifies WC Subs core.
          </li>
          <li>
            <strong className="text-[var(--fg)] font-semibold">Local-first architecture.</strong> The merchant's subscribers never depend on a third-party SaaS for their cancel flow. The free tier makes zero outbound HTTP calls to ChurnStop. Paid tiers fall back to local defaults if the license or benchmark endpoints are unreachable; a backend outage never breaks customer cancellation.
          </li>
        </ol>

        <h2 className="mt-14 text-[24px] tracking-tightish font-semibold">What we're building</h2>

        <p className="mt-5 text-[16px] text-muted leading-relaxed max-w-prose">
          Phase 1 (current): a working WooCommerce save-flow plugin with six offer types, A/B testing, save-rate analytics, cohort LTV, winback email automation, and the compliance guard. Free tier on wordpress.org, paid tiers from $79/month. Source is open on <a href="https://github.com/talbotarden/churnstop" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">GitHub</a> under GPL-2.0-or-later.
        </p>

        <p className="mt-5 text-[16px] text-muted leading-relaxed max-w-prose">
          Phase 2: universal expansion. A platform-agnostic JavaScript embed plus billing-platform adapters (Stripe, Paddle, Recurly, Chargebee, Lemon Squeezy) so the same save flow works on any merchant, not only WooCommerce. The Phase 1 architecture was designed to make Phase 2 a pure addition rather than a rewrite. See <a href="https://github.com/talbotarden/churnstop/blob/main/docs/ADR-001-phased-universal-expansion.md" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">ADR-001</a> for the technical rationale.
        </p>

        <h2 className="mt-14 text-[24px] tracking-tightish font-semibold">Get in touch</h2>

        <ul className="mt-5 space-y-2 text-[16px] text-muted leading-relaxed max-w-prose list-disc pl-6 marker:text-muted-2">
          <li>Support and sales: <a href={`mailto:support@${site.domain}`} className="text-accent underline underline-offset-4 hover:no-underline">support@{site.domain}</a></li>
          <li>Source code and issues: <a href="https://github.com/talbotarden/churnstop" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">github.com/talbotarden/churnstop</a></li>
          <li>Free-tier download: <a href="https://wordpress.org/plugins/churnstop/" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">wordpress.org/plugins/churnstop</a></li>
        </ul>
      </main>
    </>
  );
}
