import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { glossaryTerms } from '@/lib/data/glossary';

export const metadata: Metadata = {
  title: 'Subscription + churn glossary',
  description:
    'Definitions for churn rate, save rate, voluntary churn, net revenue retention, MRR, click-to-cancel, and 7 other terms every subscription operator uses. Each entry includes a formula and a worked example.',
  alternates: { canonical: '/glossary' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Glossary', path: '/glossary' },
]);

export default function GlossaryHub() {
  const sorted = [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Glossary</span>
        </nav>

        <div className="eyebrow">Glossary</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          Subscription + churn glossary.
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[62ch]">
          Practical definitions for the terms subscription operators actually use. Each page has a formula, a worked example on realistic numbers, and links to the related blog posts and calculators.
        </p>

        <ul className="mt-12 divide-y divide-[color:var(--border)] border-t border-b border-soft">
          {sorted.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/glossary/${t.slug}`}
                className="flex items-baseline justify-between py-4 hover:bg-[var(--bg-elev)] px-3 -mx-3 rounded-md"
              >
                <span className="text-[17px] font-medium tracking-tightish">{t.term}</span>
                <span className="text-[14px] text-muted max-w-[60%] text-right">{t.shortDefinition}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
