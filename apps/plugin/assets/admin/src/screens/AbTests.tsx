/**
 * A/B testing admin screen. Lists running and stopped tests, computes
 * significance on demand, and provides a minimal create form for the
 * most common experiment shape (two variants that each override the
 * default_offer). More elaborate per-reason overrides are edited via
 * JSON so merchants who know what they are doing can express them,
 * without us shipping a full rule builder in v1.
 */
import { createElement as h, Fragment, useEffect, useState } from '@wordpress/element';
import { apiGet, apiPost } from '../api';

type Variant = {
  name: string;
  weight: number;
  config: Record<string, unknown>;
};

type Test = {
  id: number;
  name: string;
  flow_id: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  variants: Variant[];
};

type Results = {
  test: Test;
  results: {
    variants: Array<{
      variant: string;
      attempts: number;
      saved: number;
      save_rate: number;
      lift_vs_control: number | null;
      p_value: number | null;
    }>;
    leader: {
      variant: string;
      save_rate: number;
      p_value: number | null;
      significant: boolean;
    } | null;
  };
};

type Flow = { id: number; name: string };

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function AbTests() {
  const [tests, setTests] = useState<Test[] | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [expanded, setExpanded] = useState<Record<number, Results>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    flowId: 0,
    variantA: '{"value":20,"duration_billing_cycles":3}',
    variantB: '{"value":30,"duration_billing_cycles":3}',
  });

  async function load() {
    setErr(null);
    try {
      const [t, f] = await Promise.all([
        apiGet<{ tests: Test[] } | { error: string; message?: string }>('ab-tests'),
        apiGet<Flow[]>('flows'),
      ]);
      if ('error' in t) {
        setErr(t.message ?? 'A/B testing requires a Starter plan or higher.');
        setTests([]);
      } else {
        setTests(t.tests);
      }
      setFlows(f);
      if (!form.flowId && f[0]) {
        setForm((prev) => ({ ...prev, flowId: f[0].id }));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load A/B tests.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function showResults(id: number) {
    try {
      const data = await apiGet<Results>(`ab-tests/${id}/results`);
      setExpanded((prev) => ({ ...prev, [id]: data }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load results.');
    }
  }

  async function stopTest(id: number) {
    if (!window.confirm('Stop this test? Outcomes already recorded are kept; no new cancellation events will be assigned.')) {
      return;
    }
    try {
      await apiPost(`ab-tests/${id}/stop`, {});
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to stop test.');
    }
  }

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      let configA: Record<string, unknown>;
      let configB: Record<string, unknown>;
      try {
        configA = JSON.parse(form.variantA);
        configB = JSON.parse(form.variantB);
      } catch {
        throw new Error('Variant config must be valid JSON.');
      }

      await apiPost('ab-tests', {
        name: form.name,
        flow_id: form.flowId,
        variants: [
          { name: 'A', weight: 50, config: { default_offer: { type: 'discount', ...configA } } },
          { name: 'B', weight: 50, config: { default_offer: { type: 'discount', ...configB } } },
        ],
      });
      setForm({ name: '', flowId: flows[0]?.id ?? 0, variantA: form.variantA, variantB: form.variantB });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create test.');
    } finally {
      setBusy(false);
    }
  }

  if (tests === null) {
    return h('div', null, h('p', null, 'Loading...'));
  }

  return h(
    'div',
    { className: 'cs-ab' },
    h('h1', null, 'A/B tests'),
    h('p', { className: 'cs-subtitle' }, 'Run two or more offer variants side-by-side and watch save rate with a two-proportion z-test. Users are sticky-bucketed so repeat cancellers stay on the same variant.'),
    err ? h('div', { className: 'notice notice-error', style: { padding: '8px 12px' } }, err) : null,
    h(
      'form',
      { onSubmit: submit, className: 'cs-ab-form', style: { marginTop: 24, padding: 16, border: '1px solid #dcdcde', borderRadius: 4 } },
      h('h2', { style: { marginTop: 0 } }, 'Create a test'),
      h(
        'p',
        null,
        h(
          'label',
          null,
          'Name: ',
          h('input', {
            type: 'text',
            value: form.name,
            required: true,
            onChange: (ev: { target: HTMLInputElement }) => setForm({ ...form, name: ev.target.value }),
            placeholder: 'e.g. 20% vs 30% default discount',
          }),
        ),
      ),
      h(
        'p',
        null,
        h(
          'label',
          null,
          'Flow: ',
          h(
            'select',
            {
              value: form.flowId || '',
              onChange: (ev: { target: HTMLSelectElement }) => setForm({ ...form, flowId: Number(ev.target.value) }),
            },
            h('option', { value: '' }, '— choose —'),
            flows.map((f) => h('option', { key: f.id, value: f.id }, `${f.name} (#${f.id})`)),
          ),
        ),
      ),
      h(
        'p',
        null,
        h(
          'label',
          null,
          'Variant A default offer JSON: ',
          h('input', {
            type: 'text',
            value: form.variantA,
            required: true,
            onChange: (ev: { target: HTMLInputElement }) => setForm({ ...form, variantA: ev.target.value }),
            style: { width: '100%', fontFamily: 'monospace' },
          }),
        ),
      ),
      h(
        'p',
        null,
        h(
          'label',
          null,
          'Variant B default offer JSON: ',
          h('input', {
            type: 'text',
            value: form.variantB,
            required: true,
            onChange: (ev: { target: HTMLInputElement }) => setForm({ ...form, variantB: ev.target.value }),
            style: { width: '100%', fontFamily: 'monospace' },
          }),
        ),
      ),
      h('button', { type: 'submit', className: 'button button-primary', disabled: busy }, busy ? 'Creating...' : 'Create test'),
    ),
    h(
      'h2',
      { style: { marginTop: 32 } },
      'Tests',
    ),
    tests.length === 0 ? h('p', null, 'No tests yet. Create one above to start.') : null,
    h(
      'ul',
      { className: 'cs-ab-list', style: { listStyle: 'none', paddingLeft: 0 } },
      tests.map((t) =>
        h(
          'li',
          { key: t.id, style: { border: '1px solid #dcdcde', borderRadius: 4, padding: 16, marginBottom: 12 } },
          h(
            'div',
            { style: { display: 'flex', justifyContent: 'space-between' } },
            h('strong', null, `${t.name} `),
            h('span', { className: `cs-badge cs-badge-${t.status}` }, t.status),
          ),
          h('p', { style: { color: '#646970' } }, `Flow #${t.flow_id} · started ${t.started_at}${t.ended_at ? ` · ended ${t.ended_at}` : ''}`),
          h(
            'div',
            { style: { marginTop: 8 } },
            h('button', { type: 'button', className: 'button', onClick: () => showResults(t.id) }, 'View results'),
            t.status === 'running'
              ? h('button', { type: 'button', className: 'button', style: { marginLeft: 8 }, onClick: () => stopTest(t.id) }, 'Stop test')
              : null,
          ),
          expanded[t.id]
            ? h(
                'table',
                { className: 'widefat striped', style: { marginTop: 12 } },
                h(
                  'thead',
                  null,
                  h(
                    'tr',
                    null,
                    h('th', null, 'Variant'),
                    h('th', null, 'Attempts'),
                    h('th', null, 'Saved'),
                    h('th', null, 'Save rate'),
                    h('th', null, 'Lift vs A'),
                    h('th', null, 'p-value'),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  expanded[t.id].results.variants.map((v) =>
                    h(
                      'tr',
                      { key: v.variant },
                      h('td', null, v.variant),
                      h('td', null, v.attempts),
                      h('td', null, v.saved),
                      h('td', null, pct(v.save_rate)),
                      h('td', null, v.lift_vs_control === null ? '—' : pct(v.lift_vs_control)),
                      h('td', null, v.p_value === null ? '—' : v.p_value.toFixed(3)),
                    ),
                  ),
                ),
                expanded[t.id].results.leader
                  ? h(
                      'tfoot',
                      null,
                      h(
                        'tr',
                        null,
                        h(
                          'td',
                          { colSpan: 6, style: { padding: 12 } },
                          expanded[t.id].results.leader!.significant
                            ? h(Fragment, null, `Leader: ${expanded[t.id].results.leader!.variant} at `, h('strong', null, pct(expanded[t.id].results.leader!.save_rate)), ` (p = ${expanded[t.id].results.leader!.p_value?.toFixed(3)} — significant at 95%).`)
                            : `Leader so far: ${expanded[t.id].results.leader!.variant} at ${pct(expanded[t.id].results.leader!.save_rate)} (not significant yet — keep the test running).`,
                        ),
                      ),
                    )
                  : null,
              )
            : null,
        ),
      ),
    ),
  );
}
