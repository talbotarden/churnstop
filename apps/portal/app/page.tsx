import Link from 'next/link';
import { CancelModalMock } from '@/components/modal-mock';
import { DashboardMock } from '@/components/dashboard-mock';
import { StatBlock } from '@/components/stat-block';
import { site } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-soft">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-center">
          <div>
            <div className="eyebrow">For WooCommerce Subscriptions</div>
            <h1 className="mt-4 text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.02] tracking-tightish font-semibold">
              Stop losing subscribers at the cancel button.
            </h1>
            <p className="mt-6 text-[18px] lg:text-[20px] text-muted max-w-[60ch] leading-relaxed">
              ChurnStop intercepts cancellations with conditional save offers built on native WooCommerce Subscriptions APIs. FTC click-to-cancel compliant by default. Reports every dollar of MRR it preserves.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={site.ctas.installFree.href}
                className="inline-flex h-11 items-center rounded-md bg-ink text-white px-5 text-sm font-medium hover:opacity-90 transition-opacity dark:bg-white dark:text-ink"
              >
                {site.ctas.installFree.label}
                <Arrow />
              </Link>
              <Link
                href={site.ctas.startTrial.href}
                className="inline-flex h-11 items-center rounded-md border border-strong px-5 text-sm font-medium hover:bg-[var(--bg-elev)] transition-colors"
              >
                {site.ctas.startTrial.label}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted-2">
              <span>Works with WooCommerce Subscriptions 4.0+</span>
              <Sep />
              <span>GPL-2.0</span>
              <Sep />
              <span>No account required for the free tier</span>
            </div>
          </div>

          <div className="lg:pl-4">
            <DashboardMock />
            <p className="mt-4 text-xs text-muted-2 text-center">
              The number every Monday standup actually wants to see.
            </p>
          </div>
        </div>
      </section>

      {/* Stat row */}
      <section className="surface border-b border-soft">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="text-sm font-medium text-muted">
            The numbers that make save flows worth building.
          </div>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock
              value="20-40%"
              label="of subscription revenue loss comes from churn."
              source="Source: SaaS industry benchmarks."
            />
            <StatBlock
              value="34%"
              label="average save rate across save-flow tools."
              source="Source: Churnkey 2024."
            />
            <StatBlock
              value="10-39%"
              label="churn reduction reported by ProsperStack customers."
              source="Source: ProsperStack case studies."
            />
            <StatBlock
              value="6.7%"
              label="save-rate drop per additional survey question."
              source="Source: Churnkey survey data."
            />
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="eyebrow">Default WooCommerce vs ChurnStop</div>
            <h2 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
              Here is what your cancel flow looks like today.
            </h2>
          </div>

          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-2 mb-3">Default WooCommerce cancellation</div>
              <DefaultWooMock />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-2 mb-3">With ChurnStop</div>
              <CancelModalMock />
            </div>
          </div>

          <p className="mt-10 max-w-prose text-[16px] leading-relaxed text-muted">
            The default flow loses every subscriber who reaches it. ChurnStop asks one question, routes to the right offer, and recovers a measurable percentage of attempts. On a $20k MRR store with 5% monthly churn, a 30% save rate preserves around $300 per month - and stacks every month after.
          </p>
        </div>
      </section>
    </>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-2" aria-hidden>
      <path d="M3 7H11M11 7L7 3M11 7L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sep() {
  return <span className="text-muted-2">/</span>;
}

function DefaultWooMock() {
  return (
    <div className="rounded-xl border border-strong bg-[var(--bg)] shadow-card overflow-hidden opacity-90">
      <div className="flex items-center justify-between px-5 py-3 border-b border-soft text-[12px] text-muted">
        <span>example.com / my-account / subscriptions</span>
        <span className="text-muted-2">Customer view</span>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold tracking-tightish">Are you sure you want to cancel?</h3>
        <p className="mt-2 text-sm text-muted max-w-md">
          You will lose access to your subscription benefits at the end of the current billing period.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button className="inline-flex h-9 items-center rounded-md border border-strong px-4 text-sm">
            Keep subscription
          </button>
          <button className="inline-flex h-9 items-center rounded-md bg-zinc-900 dark:bg-zinc-200 text-white dark:text-ink px-4 text-sm font-medium">
            Yes, cancel
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-soft text-[11px] text-muted-2">
          No question asked. No offer made. Subscriber gone.
        </div>
      </div>
    </div>
  );
}
