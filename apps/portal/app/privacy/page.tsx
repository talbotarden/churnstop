import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { site } from '@/lib/site';

const lastUpdated = '2026-04-18';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'Privacy policy for ChurnStop. Free tier transmits no data to ChurnStop servers. Paid tiers transmit license verification and aggregated, anonymized cancellation outcomes only; subscriber identities never leave the merchant\'s WooCommerce database.',
  alternates: { canonical: '/privacy' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Privacy', path: '/privacy' },
]);

export default function PrivacyPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Privacy</span>
        </nav>

        <div className="eyebrow">Legal</div>
        <h1 className="mt-3 text-[36px] lg:text-[44px] leading-tight tracking-tightish font-semibold">
          Privacy policy
        </h1>
        <p className="mt-3 text-xs text-muted-2">Last updated {lastUpdated} · Pre-launch draft</p>

        <div className="mt-8 rounded-xl border border-strong surface px-6 py-4 text-[14px]">
          <strong className="text-[var(--fg)]">Short version.</strong>{' '}
          The free ChurnStop plugin transmits nothing to ChurnStop servers. Paid tiers transmit license verification and aggregated, anonymized cancellation outcomes only. Individual subscriber identities never leave the merchant's WooCommerce database. We are not a data broker.
        </div>

        <section className="mt-12">
          <h2 className="text-[22px] tracking-tightish font-semibold">Free tier (wordpress.org plugin)</h2>
          <p className="mt-4 text-muted leading-relaxed">
            The free tier of the ChurnStop plugin runs entirely inside the merchant's WordPress install and makes no outbound HTTP calls to any ChurnStop domain. Cancellation events, customer identities, and flow configurations all stay in the merchant's own WooCommerce database.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            The free tier does use WordPress's standard plugin-update mechanism, which reaches wordpress.org to check for new versions. That traffic is governed by WordPress's own privacy policy, not this one.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Paid tiers</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Paid tiers (Starter, Growth, Agency) transmit the following to ChurnStop's backend at <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">api.{site.domain}</code>:
          </p>

          <h3 className="mt-6 text-[17px] font-semibold tracking-tightish">License verification</h3>
          <ul className="mt-3 space-y-2 text-muted list-disc pl-6 leading-relaxed">
            <li>License key (issued at checkout; bound to the merchant's account)</li>
            <li>Site URL (so we can enforce the tier's site cap)</li>
            <li>Plugin version and WordPress version (so we can warn about incompatibilities)</li>
            <li>Platform identifier (currently always <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">woocommerce</code>)</li>
          </ul>

          <h3 className="mt-6 text-[17px] font-semibold tracking-tightish">Aggregated benchmark data (Growth and Agency only)</h3>
          <ul className="mt-3 space-y-2 text-muted list-disc pl-6 leading-relaxed">
            <li>Cancellation reason bucket (e.g. <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">too_expensive</code>, <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">too_busy</code>)</li>
            <li>Offer type shown and whether it was accepted</li>
            <li>Monthly subscription value in cents, rounded to the nearest $5 bucket</li>
            <li>A random, per-site event identifier (never the customer's email or WooCommerce user ID)</li>
          </ul>

          <p className="mt-4 text-muted leading-relaxed">
            This data is used to generate cross-store benchmarks that Growth and Agency customers see in their dashboard ("stores like yours save 32% of cancellation attempts"). It is never sold, licensed to third parties, or used for marketing. Individual subscriber identities (email addresses, names, WordPress user IDs) are not transmitted. The free tier does not send any of this.
          </p>

          <h3 className="mt-6 text-[17px] font-semibold tracking-tightish">Winback email automation (Growth and Agency only)</h3>
          <p className="mt-4 text-muted leading-relaxed">
            When the merchant enables winback, ChurnStop does not send email directly. The plugin hands off to the merchant's own transactional email provider (Postmark, SES, SendGrid, whatever WordPress is configured to use) via a standard WordPress filter. Subscriber email addresses stay between the merchant's WordPress install and their own email provider; ChurnStop never sees the addresses.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">GDPR, CCPA, and data subject rights</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Because the free tier transmits no personal data and the paid tiers transmit only anonymized aggregates, neither tier produces a meaningful data subject record at ChurnStop. A paid-tier merchant whose subscriber invokes erasure (GDPR Article 17) or deletion (CCPA) has nothing to request from ChurnStop - the anonymized benchmark entry cannot be linked back to an identifiable person by design.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            The plugin also ships a <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">churnstop_data_export</code> and <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">churnstop_data_erase</code> hook that integrate with WordPress core's personal-data exporter and eraser (Tools &gt; Export Personal Data / Erase Personal Data). Data subject rights handled via WordPress core work with ChurnStop out of the box.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Cookies</h2>
          <p className="mt-4 text-muted leading-relaxed">
            The plugin sets no cookies on the merchant's customer-facing site. The customer portal at <code className="font-mono text-[0.9em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5">{site.domain}</code> uses a single session cookie for authenticated account pages; no analytics or marketing cookies are set.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Analytics on this marketing site</h2>
          <p className="mt-4 text-muted leading-relaxed">
            We do not currently run any analytics on {site.domain}. When we do, it will be a privacy-respecting service (Plausible or Fathom) that does not set cookies, does not track across sites, and does not transmit IP addresses. Google Analytics and similar are not used.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Contact</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Privacy questions or data subject requests: <a href={`mailto:privacy@${site.domain}`} className="text-accent underline underline-offset-4 hover:no-underline">privacy@{site.domain}</a>. We respond within 30 days for GDPR requests and within 45 days for CCPA requests.
          </p>
        </section>

        <p className="mt-16 text-xs text-muted-2">
          This privacy policy is a pre-launch draft. A lawyer-reviewed version will be published before the paid tier accepts its first payment. If you are evaluating ChurnStop for a store subject to stricter industry regulations (HIPAA-adjacent subscription services, financial services, children's services under COPPA), those will require additional review beyond the scope of this document.
        </p>
      </main>
    </>
  );
}
