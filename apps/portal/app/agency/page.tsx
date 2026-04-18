import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { AgencyRollup } from '@/components/agency-rollup';

export const metadata: Metadata = {
  title: 'Agency dashboard',
  description:
    'Cross-site rollup for ChurnStop Agency-tier customers. View per-site save rate and MRR preserved across every store running the plugin under your license.',
  alternates: { canonical: '/agency' },
  robots: { index: false, follow: false },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Agency', path: '/agency' },
]);

export default function AgencyPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Agency</span>
        </nav>

        <div className="eyebrow">Agency tier</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          Cross-site rollup.
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[62ch]">
          Each ChurnStop install under your Agency license reports a monthly heartbeat with attempts, saves, and MRR preserved. Paste the license key below to pull per-site metrics for any month.
        </p>

        <AgencyRollup />

        <section className="mt-16 rounded-xl border border-strong surface px-6 py-6">
          <h2 className="text-[17px] font-semibold tracking-tightish">How this works</h2>
          <ul className="mt-3 space-y-2 text-[14px] text-muted list-disc pl-6 leading-relaxed">
            <li>The plugin posts a heartbeat once a day from each installed site. Only the Agency tier gets this rollup view; Starter + Growth keys hit a 402 here.</li>
            <li>The heartbeat is a monthly aggregate — no customer-level data leaves the merchant&rsquo;s WP install.</li>
            <li>Sites only show up after their first successful heartbeat. New installs appear within 24 hours of activation.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
