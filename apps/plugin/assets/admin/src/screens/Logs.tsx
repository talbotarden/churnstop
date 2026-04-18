/**
 * Logs screen. Pages through the cancellation_events table via the REST API.
 * This is the most-looked-at admin screen for a running store because each
 * row shows reason + offer + outcome + MRR impact at a glance.
 */
import { createElement as h, useEffect, useState } from '@wordpress/element';
import { Spinner, Notice } from '@wordpress/components';
import { apiGet } from '../api';

type CancellationEvent = {
  id: number;
  user_id: number;
  subscription_id: number;
  platform: string;
  external_subscription_id: string | null;
  flow_id: number;
  cancel_reason: string | null;
  offer_shown: string | null;
  offer_accepted: 0 | 1;
  final_status: 'pending' | 'in_progress' | 'saved' | 'cancelled';
  monthly_value_cents: number;
  created_at: string;
  resolved_at: string | null;
};

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(mysql: string | null): string {
  if (!mysql) return '-';
  const d = new Date(mysql.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return mysql;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtReason(reason: string | null): string {
  if (!reason) return '-';
  return reason.replace(/_/g, ' ');
}

function fmtOffer(offer: string | null): string {
  if (!offer) return '-';
  return offer.replace(/_/g, ' ');
}

function StatusBadge({ status, accepted }: { status: CancellationEvent['final_status']; accepted: 0 | 1 }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    saved: { label: 'Saved', color: '#05422c', bg: '#dcfce7' },
    cancelled: { label: 'Cancelled', color: '#7f1d1d', bg: '#fee2e2' },
    pending: { label: 'Pending', color: '#78350f', bg: '#fef3c7' },
    in_progress: { label: 'In flow', color: '#1e3a8a', bg: '#dbeafe' },
  };
  const key = accepted ? 'saved' : status;
  const style = map[key] ?? map.pending;
  return h(
    'span',
    {
      style: {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        color: style.color,
        background: style.bg,
      },
    },
    style.label,
  );
}

export function Logs() {
  const [events, setEvents] = useState<CancellationEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'saved' | 'cancelled' | 'in_progress'>('all');

  useEffect(() => {
    apiGet<CancellationEvent[]>('events?limit=100')
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setErr(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return h(Spinner, null);
  if (err) return h(Notice, { status: 'error', isDismissible: false }, err);
  if (!events) return h(Notice, { status: 'error', isDismissible: false }, 'Failed to load events.');

  const filtered = filterStatus === 'all' ? events : events.filter((e) => e.final_status === filterStatus);
  const totalPreserved = filtered
    .filter((e) => e.final_status === 'saved')
    .reduce((acc, e) => acc + e.monthly_value_cents, 0);

  return h('div', null,
    h('h1', null, 'Logs'),
    h('p', { className: 'cs-subtitle' }, 'Every cancellation attempt with reason, offer shown, and outcome. Most recent 100 shown; pipe to your own warehouse via the churnstop_cancellation_resolved action hook.'),

    // Filter bar.
    h('div', { className: 'cs-logs-filters' },
      h('div', { className: 'cs-logs-count' }, `${filtered.length} of ${events.length} events`),
      h('div', { className: 'cs-logs-preserved' },
        h('span', { className: 'cs-logs-preserved-label' }, 'MRR preserved in view:'),
        ' ',
        h('strong', null, fmtMoney(totalPreserved)),
      ),
      h('select', {
        value: filterStatus,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as typeof filterStatus),
      },
        h('option', { value: 'all' }, 'All statuses'),
        h('option', { value: 'saved' }, 'Saved'),
        h('option', { value: 'cancelled' }, 'Cancelled'),
        h('option', { value: 'in_progress' }, 'In flow'),
      ),
    ),

    filtered.length === 0
      ? h('div', { className: 'cs-section' },
          h('p', { className: 'cs-section-help' }, 'No events match this filter yet.'),
        )
      : h('table', { className: 'cs-logs-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, 'When'),
              h('th', null, 'Sub ID'),
              h('th', null, 'Reason'),
              h('th', null, 'Offer shown'),
              h('th', null, 'Status'),
              h('th', { style: { textAlign: 'right' } }, 'Monthly value'),
            ),
          ),
          h('tbody', null,
            filtered.map((e) => h('tr', { key: e.id },
              h('td', null, fmtDate(e.created_at)),
              h('td', { className: 'cs-logs-mono' }, e.external_subscription_id ?? String(e.subscription_id)),
              h('td', null, fmtReason(e.cancel_reason)),
              h('td', null, fmtOffer(e.offer_shown)),
              h('td', null, h(StatusBadge, { status: e.final_status, accepted: e.offer_accepted })),
              h('td', { style: { textAlign: 'right' }, className: 'cs-logs-mono' }, fmtMoney(e.monthly_value_cents)),
            )),
          ),
        ),

    h('div', { className: 'cs-section' },
      h('h2', null, 'Exporting'),
      h('p', { className: 'cs-section-help' }, 'For bulk export, use GET /wp-json/churnstop/v1/events?limit=100&offset=N. For real-time piping into Segment, Mixpanel, or a warehouse, hook the churnstop_cancellation_resolved action. See the API docs at churnstop.org/docs/api.'),
    ),
  );
}
