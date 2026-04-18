import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { calculators } from '@/lib/data/calculators';

export const metadata: Metadata = {
  title: 'Subscription churn calculators',
  description:
    'Free calculators for monthly churn rate, save-rate impact, subscription LTV, and winback revenue. Built for WooCommerce subscription operators. No signup required.',
  alternates: { canonical: '/calculators' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Calculators', path: '/calculators' },
]);

export default function CalculatorsHub() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Calculators</span>
        </nav>

        <div className="eyebrow">Calculators</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          Free subscription churn calculators.
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[62ch]">
          Four focused calculators for the math subscription operators run weekly: churn rate, save-rate impact, LTV lift, and winback revenue. No signup, no tracking, runs in your browser.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {calculators.map((c) => (
            <Link
              key={c.slug}
              href={`/calculators/${c.slug}`}
              className="group rounded-xl border border-strong p-6 hover:border-[var(--fg)] transition-colors"
            >
              <h2 className="text-[18px] font-semibold tracking-tightish group-hover:underline underline-offset-4">
                {c.name}
              </h2>
              <p className="mt-2 text-[14px] text-muted leading-relaxed">{c.summary}</p>
              <div className="mt-4 text-[12px] text-muted-2">
                Inputs: {c.inputs.join(', ')}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
