import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { comparisons } from '@/lib/data/comparisons';

export const metadata: Metadata = {
  title: 'ChurnStop vs alternatives',
  description:
    'Honest comparisons between ChurnStop and the other cancellation save-flow tools. Churnkey, ProsperStack, Brightback (Chargebee Retain), Retainly, and other WooCommerce cancellation plugins.',
  alternates: { canonical: '/vs' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Compare', path: '/vs' },
]);

export default function ComparisonsHub() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Compare</span>
        </nav>

        <div className="eyebrow">Compare</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          ChurnStop vs the alternatives.
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[62ch]">
          Honest comparisons against the other tools in the cancellation save-flow space. Pricing, scope, platform fit, and when each choice makes sense. We say when a competitor is the better pick for your situation — because "everyone is better off with ChurnStop" is not a useful answer.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {comparisons.map((c) => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              className="group rounded-xl border border-strong p-6 hover:border-[var(--fg)] transition-colors"
            >
              <h2 className="text-[18px] font-semibold tracking-tightish group-hover:underline underline-offset-4">
                ChurnStop vs {c.competitor}
              </h2>
              <p className="mt-2 text-[14px] text-muted leading-relaxed">{c.oneLiner}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
