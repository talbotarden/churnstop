import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { site } from '@/lib/site';

const lastUpdated = '2026-04-18';

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'Terms of service for the ChurnStop WordPress plugin and paid SaaS tiers. Plugin source is GPL-2.0-or-later. Paid-tier service terms are in pre-launch draft; final terms publish before paid checkout goes live.',
  alternates: { canonical: '/terms' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Terms', path: '/terms' },
]);

export default function TermsPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Terms</span>
        </nav>

        <div className="eyebrow">Legal</div>
        <h1 className="mt-3 text-[36px] lg:text-[44px] leading-tight tracking-tightish font-semibold">
          Terms of service
        </h1>
        <p className="mt-3 text-xs text-muted-2">Last updated {lastUpdated} · Pre-launch draft</p>

        <div className="mt-8 rounded-xl border border-strong surface px-6 py-4 text-[14px]">
          <strong className="text-[var(--fg)]">Pre-launch draft.</strong>{' '}
          ChurnStop is not yet accepting paid-tier checkouts. These terms apply to the free WordPress plugin as shipped on wordpress.org and describe the paid-tier terms in draft form. Final paid-tier terms will be published before checkout goes live and will be linked from this URL; merchants will re-affirm acceptance at signup.
        </div>

        <section className="mt-12">
          <h2 className="mt-2 text-[22px] tracking-tightish font-semibold">The plugin (free tier)</h2>
          <p className="mt-4 text-muted leading-relaxed">
            The ChurnStop WordPress plugin is licensed under the GNU General Public License, version 2 or later (GPL-2.0-or-later). The full license text ships with the plugin and is available at{' '}
            <a href="https://www.gnu.org/licenses/gpl-2.0.html" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">gnu.org/licenses/gpl-2.0.html</a>. You may use, modify, and redistribute the plugin under that license.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            The plugin is provided "as is" without warranty of any kind. ChurnStop and its contributors are not liable for any damages arising from use of the plugin, including but not limited to lost revenue, lost subscribers, or regulatory penalties. Merchants are responsible for verifying that their specific use complies with applicable law.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Paid tiers (draft)</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Paid tiers (Starter, Growth, Agency) will be offered as monthly or annual subscriptions billed through Stripe. These terms become binding for merchants who complete paid-tier checkout:
          </p>
          <ul className="mt-4 space-y-2 text-muted list-disc pl-6 leading-relaxed">
            <li>Subscriptions auto-renew at the end of each billing period unless cancelled.</li>
            <li>Cancellation is self-service from the customer portal and takes effect at the end of the current billing period. No refunds for partial periods; no cancellation fees.</li>
            <li>A 14-day free trial is offered on first sign-up; cancellation during the trial incurs no charge.</li>
            <li>The paid tier grants a license key that unlocks paid-tier features in the plugin. The license is bound to the sites declared at activation; the tier's site cap governs how many sites a single license covers (Starter: 1, Growth: 3, Agency: 25).</li>
            <li>ChurnStop may update these terms with 30 days written notice. Material changes do not retroactively apply to billing periods already paid for.</li>
            <li>Either party may terminate for breach with 30 days notice and opportunity to cure.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Acceptable use</h2>
          <p className="mt-4 text-muted leading-relaxed">
            The plugin and service are not to be used for: illegal subscriptions (gambling services unlicensed in the merchant's jurisdiction, regulated financial products without the required licenses, and any product class that violates the Stripe Restricted Business List), flows that violate the FTC click-to-cancel rule or state ROSCA analogues (the compliance validator prevents most such configurations from being saved; deliberately bypassing the validator or shipping custom flow code that evades it is out of scope for the service), or circumvention of applicable consumer protection law.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Data and privacy</h2>
          <p className="mt-4 text-muted leading-relaxed">
            See the <Link href="/privacy" className="text-accent underline underline-offset-4 hover:no-underline">privacy policy</Link> for the full data-handling statement. Summary: the free tier never contacts ChurnStop servers. Paid tiers transmit license-key verification and aggregated, anonymized cancellation outcomes for cross-store benchmarks; no individual subscriber identities or email addresses leave the merchant's WooCommerce database.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] tracking-tightish font-semibold">Contact</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Questions about these terms: <a href={`mailto:support@${site.domain}`} className="text-accent underline underline-offset-4 hover:no-underline">support@{site.domain}</a>.
          </p>
        </section>

        <p className="mt-16 text-xs text-muted-2">
          These terms are a pre-launch draft and are not legal advice. A final, lawyer-reviewed version will be published before the paid tier accepts its first payment. If you are evaluating ChurnStop for a store subject to industry-specific regulations, review those with your counsel before relying on this draft.
        </p>
      </main>
    </>
  );
}
