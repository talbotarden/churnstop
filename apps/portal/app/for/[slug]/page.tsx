import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { getPersona, personaSlugs, personas } from '@/lib/data/personas';
import { publishedPosts } from '@/lib/blog';

export function generateStaticParams() {
  return personaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPersona(slug);
  if (!p) return {};
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: `/for/${p.slug}` },
  };
}

function formatUsd(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPersona(slug);
  if (!p) notFound();

  const posts = publishedPosts();
  const relatedPosts = posts.filter((post) => p.relatedBlogSlugs.includes(post.slug));
  const otherVerticals = personas.filter((v) => v.slug !== p.slug);

  const { mrr, attemptsPerMonth, defaultSaveRate, optimizedSaveRate, avgMonthlyValue } = p.mathExample;
  const defaultSaved = Math.round(attemptsPerMonth * defaultSaveRate);
  const optimizedSaved = Math.round(attemptsPerMonth * optimizedSaveRate);
  const defaultMrrPreserved = defaultSaved * avgMonthlyValue;
  const optimizedMrrPreserved = optimizedSaved * avgMonthlyValue;
  const deltaMrr = optimizedMrrPreserved - defaultMrrPreserved;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'By vertical', path: '/for' },
    { name: p.vertical, path: `/for/${p.slug}` },
  ]);

  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <Link href="/for" className="hover:text-[var(--fg)]">By vertical</Link>
          <span aria-hidden className="px-2">/</span>
          <span>{p.vertical}</span>
        </nav>

        <div className="eyebrow">{p.shortLabel}</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          {p.hero.headline}
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[58ch]">{p.hero.subhead}</p>

        <section className="mt-12 rounded-xl border border-strong p-6">
          <div className="eyebrow">Business shape</div>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-[14px]">
            <div>
              <dt className="text-muted-2">Typical MRR</dt>
              <dd className="font-medium">{p.businessShape.typicalMrr}</dd>
            </div>
            <div>
              <dt className="text-muted-2">Typical AOV</dt>
              <dd className="font-medium">{p.businessShape.typicalAov}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-2">Renewal cadence</dt>
              <dd className="font-medium">{p.businessShape.renewalCadence}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <div className="eyebrow">Primary churn drivers</div>
            <ul className="mt-2 space-y-1 text-[14px] text-muted">
              {p.businessShape.primaryChurnDrivers.map((d) => (
                <li key={d}>- {d}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tightish">Benchmarks</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {p.benchmarks.map((b) => (
              <div key={b.label} className="rounded-xl border border-strong p-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-2">{b.label}</div>
                <div className="mt-1 text-[22px] font-semibold font-mono">{b.value}</div>
                <div className="mt-1 text-[11px] text-muted-2">{b.source}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tightish">Reason -&gt; offer routing</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed max-w-[62ch]">
            This is the routing table we would ship in the plugin for {p.shortLabel.toLowerCase()}. Each reason maps to the offer that converts best for this vertical, with the rationale.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-strong">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--bg-elev)] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Cancel reason</th>
                  <th className="px-4 py-2 font-medium">Offer</th>
                  <th className="px-4 py-2 font-medium">Why</th>
                </tr>
              </thead>
              <tbody>
                {p.routingTable.map((r) => (
                  <tr key={r.reason} className="border-t border-soft align-top">
                    <td className="px-4 py-3 font-mono text-[12px]">{r.reason}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-soft px-2 py-0.5 font-medium text-[12px]">{r.offer}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tightish">What the math looks like</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed max-w-[62ch]">
            Example: a {p.shortLabel.toLowerCase()} store at {formatUsd(mrr)} MRR with ~{attemptsPerMonth} cancel clicks per month.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-strong">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--bg-elev)] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Scenario</th>
                  <th className="px-4 py-2 font-medium text-right">Save rate</th>
                  <th className="px-4 py-2 font-medium text-right">Saved / mo</th>
                  <th className="px-4 py-2 font-medium text-right">MRR preserved</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-soft">
                  <td className="px-4 py-2">Default (generic discount-only flow)</td>
                  <td className="px-4 py-2 text-right">{Math.round(defaultSaveRate * 100)}%</td>
                  <td className="px-4 py-2 text-right">{defaultSaved}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatUsd(defaultMrrPreserved)}</td>
                </tr>
                <tr className="border-t border-soft bg-[var(--bg-elev)]">
                  <td className="px-4 py-2 font-medium">Vertical-tuned routing</td>
                  <td className="px-4 py-2 text-right font-medium">{Math.round(optimizedSaveRate * 100)}%</td>
                  <td className="px-4 py-2 text-right font-medium">{optimizedSaved}</td>
                  <td className="px-4 py-2 text-right font-mono font-medium">{formatUsd(optimizedMrrPreserved)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[14px] text-muted">
            Delta: <strong className="text-[var(--fg)]">{formatUsd(deltaMrr)}</strong> of MRR preserved per month on top of the default flow. Annualised, that is {formatUsd(deltaMrr * 12)}.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tightish">WooCommerce stack</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed max-w-[62ch]">
            ChurnStop is built on WooCommerce Subscriptions. We have tested integration against these stacks for {p.shortLabel.toLowerCase()}:
          </p>
          <ul className="mt-3 space-y-1 text-[14px] text-muted">
            {p.wcProducts.map((prod) => (
              <li key={prod}>- {prod}</li>
            ))}
          </ul>
        </section>

        {relatedPosts.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[22px] font-semibold tracking-tightish">Related reading</h2>
            <ul className="mt-3 space-y-2">
              {relatedPosts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="text-accent underline underline-offset-4 hover:no-underline">
                    {post.title}
                  </Link>
                  <span className="ml-2 text-[13px] text-muted">{post.description}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16 rounded-xl border border-strong surface p-6">
          <h2 className="text-[17px] font-semibold tracking-tightish">Install ChurnStop</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed">
            The free plugin runs the default flow with no external calls. Paid tiers unlock the vertical-tuned routing, A/B testing, cohort LTV, and the 3-step winback sequence.
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
          <h2 className="text-[17px] font-semibold tracking-tightish">Other verticals</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherVerticals.map((v) => (
              <Link
                key={v.slug}
                href={`/for/${v.slug}`}
                className="rounded-full border border-soft px-3 py-1 text-[13px] hover:border-[var(--fg)]"
              >
                {v.vertical}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
