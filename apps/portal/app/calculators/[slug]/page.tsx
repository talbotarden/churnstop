import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { calculators, getCalculator, calculatorSlugs } from '@/lib/data/calculators';
import { ChurnRateCalculator } from '@/components/calculators/churn-rate';
import { SaveRateImpactCalculator } from '@/components/calculators/save-rate-impact';
import { LtvLiftCalculator } from '@/components/calculators/ltv-lift';
import { WinbackRevenueCalculator } from '@/components/calculators/winback-revenue';

export function generateStaticParams() {
  return calculatorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCalculator(slug);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/calculators/${c.slug}` },
  };
}

const CALCULATOR_COMPONENTS: Record<string, () => JSX.Element> = {
  'churn-rate': ChurnRateCalculator,
  'save-rate-impact': SaveRateImpactCalculator,
  'ltv-lift': LtvLiftCalculator,
  'winback-revenue': WinbackRevenueCalculator,
};

export default async function CalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCalculator(slug);
  if (!c) notFound();

  const Calc = CALCULATOR_COMPONENTS[c.slug];
  if (!Calc) notFound();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Calculators', path: '/calculators' },
    { name: c.name, path: `/calculators/${c.slug}` },
  ]);

  const others = calculators.filter((o) => o.slug !== c.slug);

  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <Link href="/calculators" className="hover:text-[var(--fg)]">Calculators</Link>
          <span aria-hidden className="px-2">/</span>
          <span>{c.name}</span>
        </nav>

        <div className="eyebrow">Calculator</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          {c.name}
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[58ch]">
          {c.longDescription}
        </p>

        <div className="mt-10">
          <Calc />
        </div>

        <section className="mt-16 rounded-xl border border-strong surface p-6">
          <h2 className="text-[17px] font-semibold tracking-tightish">Want to move these numbers?</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed">
            ChurnStop ships a save flow that intercepts cancellations on WooCommerce Subscriptions. Free plugin with no external calls; paid tiers add A/B testing, cohort LTV, and a 7/21/60 winback sequence.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/downloads/churnstop.zip"
              className="rounded-md bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90 dark:bg-white dark:text-ink"
            >
              Download churnstop.zip
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-strong px-4 py-2 text-sm font-medium hover:bg-[var(--bg-elev)]"
            >
              See pricing
            </Link>
          </div>
        </section>

        <section className="mt-12 border-t border-soft pt-8">
          <h2 className="text-[17px] font-semibold tracking-tightish">Other calculators</h2>
          <ul className="mt-3 space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/calculators/${o.slug}`} className="text-accent underline underline-offset-4 hover:no-underline">
                  {o.name}
                </Link>
                <span className="ml-2 text-[13px] text-muted">- {o.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
