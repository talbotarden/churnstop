import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { docSections, getDocsBySection } from '@/lib/docs';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'ChurnStop documentation: getting started in 5-10 minutes, offer types reference, REST API and WordPress hooks, A/B testing guide, winback email sequences. Covers WooCommerce Subscriptions 4.0+ on WordPress 6.0+ with PHP 7.4+.',
  alternates: { canonical: '/docs' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Docs', path: '/docs' },
]);

export default function DocsIndexPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
        <span aria-hidden className="px-2">/</span>
        <span>Docs</span>
      </nav>

      <div className="eyebrow">Documentation</div>
      <h1 className="mt-3 text-[40px] lg:text-[48px] leading-[1.05] tracking-tightish font-semibold">
        Install ChurnStop. Ship the save flow. Measure MRR preserved.
      </h1>
      <p className="mt-5 text-[18px] text-muted max-w-[62ch] leading-relaxed">
        End-to-end docs for the ChurnStop plugin on WooCommerce Subscriptions. Start with the getting-started guide to go from zero to a working save flow in 5-10 minutes, then dig into the offer types reference or the REST API as you need them.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted-2">
        <span>Requires WordPress 6.0+</span>
        <span aria-hidden>·</span>
        <span>WooCommerce 8.0+</span>
        <span aria-hidden>·</span>
        <span>WooCommerce Subscriptions 4.0+</span>
        <span aria-hidden>·</span>
        <span>PHP 7.4+</span>
      </div>

      {docSections.map((section) => {
        const entries = getDocsBySection(section);
        if (entries.length === 0) return null;
        return (
          <section key={section} className="mt-16">
            <h2 className="text-[22px] tracking-tightish font-semibold">{section}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {entries.map((doc) => {
                const href = `/docs/${doc.slug}`;
                const soon = doc.status === 'coming-soon';
                return (
                  <Link
                    key={doc.slug}
                    href={href}
                    className={`group rounded-xl border border-strong p-5 transition-colors ${
                      soon ? 'opacity-70 pointer-events-none' : 'hover:border-[var(--fg)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[17px] font-medium tracking-tightish">{doc.title}</h3>
                      {soon ? (
                        <span className="text-[10px] uppercase tracking-wider text-muted-2 shrink-0 mt-1">
                          Coming soon
                        </span>
                      ) : doc.readingTime ? (
                        <span className="text-[11px] text-muted-2 shrink-0 mt-1">{doc.readingTime}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[14px] text-muted leading-relaxed">
                      {doc.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="mt-20 rounded-xl border border-strong surface px-8 py-8">
        <h2 className="text-xl font-semibold tracking-tightish">Need something that isn't here?</h2>
        <p className="mt-3 text-muted max-w-prose">
          Docs coverage follows shipped features. A guide listed as "coming soon" above is waiting on the matching paid-tier feature to ship. In the meantime you can read the source on <a href="https://github.com/talbotarden/churnstop" className="text-accent underline underline-offset-4 hover:no-underline">GitHub</a>, open an issue, or ask a question at support@{site.domain}.
        </p>
      </section>
    </>
  );
}
