import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { personas } from '@/lib/data/personas';

export const metadata: Metadata = {
  title: 'Save flows by vertical',
  description:
    'Cancellation save flow playbooks for WooCommerce subscription boxes, SaaS, memberships, courses, paid newsletters, and replenishment commerce. Each vertical has a different optimal offer routing table.',
  alternates: { canonical: '/for' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'By vertical', path: '/for' },
]);

export default function PersonasHub() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-5xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>By vertical</span>
        </nav>

        <div className="eyebrow">By vertical</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          Save flows by subscription business model.
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[62ch]">
          Different verticals cancel for different reasons. A subscription box cancels on scheduling; a SaaS product cancels on budget; a newsletter cancels on inbox fatigue. The right offer routing table is not the same in any two of these. Pick your vertical.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {personas.map((p) => (
            <Link
              key={p.slug}
              href={`/for/${p.slug}`}
              className="group rounded-xl border border-strong p-6 hover:border-[var(--fg)] transition-colors"
            >
              <div className="eyebrow">{p.shortLabel}</div>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tightish group-hover:underline underline-offset-4">
                {p.vertical}
              </h2>
              <p className="mt-2 text-[14px] text-muted leading-relaxed">{p.hero.subhead}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-2">
                {p.benchmarks.slice(0, 2).map((b) => (
                  <span key={b.label} className="rounded-full border border-soft px-2.5 py-0.5">
                    {b.label}: {b.value}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
