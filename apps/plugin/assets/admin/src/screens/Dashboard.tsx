import { createElement as h, useEffect, useState } from '@wordpress/element';
import { Spinner, Notice } from '@wordpress/components';
import { apiGet } from '../api';

type Summary = {
  period_start: string;
  period_end: string;
  total_attempts: number;
  saved: number;
  save_rate: number;
  mrr_preserved_cents: number;
};

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtMonth(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Summary>('stats/summary')
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setErr(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return h(Spinner, null);
  if (err) return h(Notice, { status: 'error', isDismissible: false }, err);
  if (!summary) return h(Notice, { status: 'error', isDismissible: false }, 'Failed to load summary.');

  return h('div', null,
    h('h1', null, 'ChurnStop'),
    h('p', { className: 'cs-subtitle' }, `Cancellation save flow for WooCommerce Subscriptions - ${fmtMonth(summary.period_start)}`),

    h('div', { className: 'cs-grid' },
      h('div', { className: 'cs-stat-card' },
        h('p', { className: 'cs-stat-label' }, 'MRR preserved'),
        h('p', { className: 'cs-stat-value' }, fmtMoney(summary.mrr_preserved_cents)),
        h('p', { className: 'cs-stat-help' }, `${summary.saved} saved of ${summary.total_attempts} attempts`),
      ),
      h('div', { className: 'cs-stat-card' },
        h('p', { className: 'cs-stat-label' }, 'Save rate'),
        h('p', { className: 'cs-stat-value' }, `${summary.save_rate}%`),
        h('p', { className: 'cs-stat-help' }, 'Of cancellation attempts this month'),
      ),
      h('div', { className: 'cs-stat-card' },
        h('p', { className: 'cs-stat-label' }, 'Cancellation attempts'),
        h('p', { className: 'cs-stat-value' }, summary.total_attempts.toString()),
        h('p', { className: 'cs-stat-help' }, 'Customers who clicked cancel this month'),
      ),
    ),

    summary.total_attempts === 0
      ? h('div', { className: 'cs-section' },
          h('h2', null, 'Waiting for your first cancellation attempt'),
          h('p', { className: 'cs-section-help' },
            'Your save flow is live. The next time a subscriber clicks cancel on their My Account page, they will see the survey and save offer. The dashboard will populate automatically.',
          ),
        )
      : null,

    h('div', { className: 'cs-section' },
      h('h2', null, 'Configuration'),
      h('p', { className: 'cs-section-help' },
        'Adjust default offer amounts, survey options, and branding on the Settings screen. Premium tiers unlock conditional branching, A/B testing, and cohort analytics.',
      ),
    ),
  );
}
