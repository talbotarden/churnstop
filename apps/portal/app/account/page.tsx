import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Account',
  description:
    'ChurnStop customer account and license management. Free tier needs no account; paid tiers get a customer portal for license keys, billing, and plugin downloads.',
  alternates: { canonical: '/account' },
  robots: { index: false, follow: false },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Account', path: '/account' },
]);

export default function AccountPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-2xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Account</span>
        </nav>

        <div className="eyebrow">Account</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          The customer portal ships with the paid tier.
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[58ch]">
          The ChurnStop paid tier (Starter, Growth, Agency) is in pre-launch. When paid checkout opens, this page will become the portal for managing your license keys, changing billing details, and downloading the latest plugin build. Until then, the free tier is the only public release and no account is required.
        </p>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-strong p-5">
            <div className="eyebrow">Free tier</div>
            <h2 className="mt-2 text-[17px] font-semibold tracking-tightish">Install without signing up</h2>
            <p className="mt-2 text-[14px] text-muted leading-relaxed">
              The free plugin runs locally and never contacts ChurnStop servers. No account, no license key, no identifying data transmitted.
            </p>
            <Link
              href={site.ctas.installFree.href}
              className="mt-4 inline-flex h-9 items-center rounded-md bg-ink text-white px-4 text-sm font-medium hover:opacity-90 transition-opacity dark:bg-white dark:text-ink"
            >
              Download churnstop.zip
            </Link>
          </div>

          <div className="rounded-xl border border-strong p-5 opacity-90">
            <div className="eyebrow">Paid tiers</div>
            <h2 className="mt-2 text-[17px] font-semibold tracking-tightish">Portal coming soon</h2>
            <p className="mt-2 text-[14px] text-muted leading-relaxed">
              When Stripe checkout launches, the portal will live here. Self-service license, billing, and downloads. Existing waitlist subscribers get notified first.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex h-9 items-center rounded-md border border-strong px-4 text-sm font-medium hover:bg-[var(--bg-elev)] transition-colors"
            >
              View plan details
            </Link>
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-strong surface px-6 py-6">
          <h2 className="text-[17px] font-semibold tracking-tightish">Need something now?</h2>
          <ul className="mt-3 space-y-2 text-[14px] text-muted list-disc pl-6 leading-relaxed">
            <li>License key support or billing questions: <a href={`mailto:support@${site.domain}`} className="text-accent underline underline-offset-4 hover:no-underline">support@{site.domain}</a></li>
            <li>Plugin bugs or feature requests: <a href="https://github.com/talbotarden/churnstop/issues" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">GitHub issues</a></li>
            <li>Privacy questions or data subject requests: <a href={`mailto:privacy@${site.domain}`} className="text-accent underline underline-offset-4 hover:no-underline">privacy@{site.domain}</a></li>
          </ul>
        </section>
      </main>
    </>
  );
}
