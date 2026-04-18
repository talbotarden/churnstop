/**
 * Cohort LTV analytics screen. Renders the cohort retention matrix and
 * the derived LTV per cohort. Data is computed server-side by
 * CohortLtv::compute and cached for an hour; the "refresh" button
 * bypasses the cache.
 */
import { createElement as h, Fragment, useEffect, useState } from '@wordpress/element';
import { apiGet } from '../api';

type Month = {
  month: number;
  retained: number;
  retention: number;
  cumulative_revenue_cents: number;
};

type Cohort = {
  cohort: string;
  size: number;
  months: Month[];
  ltv_cents: number;
};

type CohortResponse = {
  cohorts: Cohort[];
  generated_at: string;
  cached: boolean;
};

type ErrorResponse = { error: string; message?: string };

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function retentionColor(r: number): string {
  if (r >= 0.8) return '#d1fae5';
  if (r >= 0.6) return '#ecfccb';
  if (r >= 0.4) return '#fef3c7';
  if (r >= 0.2) return '#fed7aa';
  return '#fee2e2';
}

export function Analytics() {
  const [data, setData] = useState<CohortResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(fresh: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await apiGet<CohortResponse | ErrorResponse>(
        `analytics/cohort-ltv${fresh ? '?fresh=1' : ''}`,
      );
      if ('error' in res) {
        setErr(res.message ?? 'Cohort LTV analytics requires a Growth plan or higher.');
        setData(null);
      } else {
        setData(res);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load cohort LTV.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (err) {
    return h('div', null,
      h('h1', null, 'Analytics'),
      h('div', { className: 'notice notice-error', style: { padding: '8px 12px' } }, err),
    );
  }

  if (!data) {
    return h('div', null, h('p', null, 'Loading...'));
  }

  if (data.cohorts.length === 0) {
    return h('div', null,
      h('h1', null, 'Analytics'),
      h('p', { className: 'cs-subtitle' }, 'No subscriptions yet in the last 12 months — once customers start subscribing, cohorts will appear here.'),
    );
  }

  return h(Fragment, null,
    h('h1', null, 'Cohort LTV'),
    h('p', { className: 'cs-subtitle' },
      'Retention and cumulative revenue by monthly subscription cohort. Generated ',
      data.generated_at.substring(0, 16).replace('T', ' '),
      data.cached ? ' (cached, ' : ' (',
      h('button', {
        type: 'button',
        className: 'button-link',
        disabled: busy,
        onClick: () => load(true),
      }, busy ? 'refreshing...' : 'refresh'),
      ').',
    ),
    h('table', { className: 'widefat striped cs-cohort-table' },
      h('thead', null,
        h('tr', null,
          h('th', null, 'Cohort'),
          h('th', null, 'Size'),
          h('th', null, 'LTV'),
          ...Array.from({ length: 13 }, (_, m) => h('th', { key: m, style: { textAlign: 'center' } }, `M${m}`)),
        ),
      ),
      h('tbody', null,
        data.cohorts.map((c) =>
          h('tr', { key: c.cohort },
            h('td', null, c.cohort),
            h('td', null, c.size),
            h('td', null, money(c.ltv_cents)),
            ...c.months.map((m) =>
              h('td', {
                key: m.month,
                style: {
                  background: retentionColor(m.retention),
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: 12,
                },
              }, pct(m.retention)),
            ),
          ),
        ),
      ),
    ),
  );
}
