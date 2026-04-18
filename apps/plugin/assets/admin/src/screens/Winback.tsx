/**
 * Winback automation admin screen. Shows the currently-configured
 * sequence (merchants override via the `churnstop_winback_sequence`
 * filter in a child plugin) and the recent queue status so operators
 * can see what is flowing out.
 */
import { createElement as h, Fragment, useEffect, useState } from '@wordpress/element';
import { apiGet } from '../api';

type Step = { step: number; delay_days: number; subject: string; body: string };

type QueueRow = {
  id: number;
  cancellation_event_id: number;
  recipient_email: string;
  step_number: number;
  subject: string;
  status: string;
  send_at: string;
  sent_at: string | null;
  error_msg: string | null;
};

type SeqResponse = { sequence: Step[] } | { error: string; message?: string };
type QueueResponse = { queue: QueueRow[]; summary: Record<string, number> } | { error: string; message?: string };

export function Winback() {
  const [sequence, setSequence] = useState<Step[] | null>(null);
  const [queue, setQueue] = useState<QueueRow[] | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, q] = await Promise.all([
          apiGet<SeqResponse>('winback/sequence'),
          apiGet<QueueResponse>('winback/queue'),
        ]);
        if ('error' in s) {
          setErr(s.message ?? 'Winback automation requires a Growth plan or higher.');
          return;
        }
        setSequence(s.sequence);
        if ('error' in q) {
          setErr(q.message ?? 'Winback automation requires a Growth plan or higher.');
          return;
        }
        setQueue(q.queue);
        setSummary(q.summary);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed to load winback.');
      }
    })();
  }, []);

  if (err) {
    return h('div', null,
      h('h1', null, 'Winback'),
      h('div', { className: 'notice notice-error', style: { padding: '8px 12px' } }, err),
    );
  }

  if (!sequence || !queue) {
    return h('div', null, h('p', null, 'Loading...'));
  }

  return h(Fragment, null,
    h('h1', null, 'Winback automation'),
    h('p', { className: 'cs-subtitle' },
      'Cancelled customers get a 3-step email sequence: 7, 21, and 60 days after the cancellation event. ',
      'Resubscribing, unsubscribing, or a send failure stops the sequence. ',
      'Override the template via the ',
      h('code', null, 'churnstop_winback_sequence'),
      ' filter in a child plugin.',
    ),

    h('h2', { style: { marginTop: 24 } }, 'Sequence'),
    h('ol', { className: 'cs-winback-steps' },
      sequence.map((s) =>
        h('li', { key: s.step, style: { marginBottom: 16, padding: 16, border: '1px solid #dcdcde', borderRadius: 4 } },
          h('div', { style: { fontWeight: 600 } }, `Day ${s.delay_days}: ${s.subject}`),
          h('pre', { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#50575e', marginTop: 8 } }, s.body),
        ),
      ),
    ),

    h('h2', { style: { marginTop: 24 } }, 'Queue'),
    h('p', { className: 'cs-subtitle' },
      Object.entries(summary).map(([status, count]) =>
        h('span', { key: status, style: { marginRight: 16 } }, `${status}: ${count}`),
      ),
    ),
    h('table', { className: 'widefat striped' },
      h('thead', null,
        h('tr', null,
          h('th', null, 'Recipient'),
          h('th', null, 'Step'),
          h('th', null, 'Subject'),
          h('th', null, 'Send at'),
          h('th', null, 'Status'),
        ),
      ),
      h('tbody', null,
        queue.length === 0 ? h('tr', null, h('td', { colSpan: 5 }, 'No winback jobs yet.')) : null,
        queue.map((r) =>
          h('tr', { key: r.id },
            h('td', null, r.recipient_email),
            h('td', null, r.step_number),
            h('td', null, r.subject),
            h('td', { style: { fontFamily: 'monospace', fontSize: 12 } }, r.send_at),
            h('td', null, r.status + (r.error_msg ? ` (${r.error_msg})` : '')),
          ),
        ),
      ),
    ),
  );
}
