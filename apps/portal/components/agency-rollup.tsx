'use client';

import { useState } from 'react';

type Site = {
  site_url: string;
  platform: string;
  attempts: number;
  saved: number;
  save_rate: number;
  mrr_preserved_cents: number;
  plugin_version: string | null;
  reported_at: string;
};

type RollupResponse =
  | {
      ok: true;
      month: string;
      totals: {
        attempts: number;
        saved: number;
        mrr_preserved_cents: number;
        save_rate: number;
        site_count: number;
      };
      sites: Site[];
    }
  | { ok: false; error: string; upgrade_to?: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.churnstop.org';

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function AgencyRollup() {
  const [key, setKey] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<RollupResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/license/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), month }),
      });
      const body = (await res.json()) as RollupResponse;
      if (body.ok === false) {
        setErr(body.error || 'Rollup request failed.');
      } else {
        setData(body);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Rollup request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <form onSubmit={submit} className="rounded-xl border border-strong p-6 surface">
        <h2 className="text-[17px] font-semibold tracking-tightish">Pull your agency rollup</h2>
        <p className="mt-2 text-[14px] text-muted leading-relaxed">
          Paste an Agency license key to see per-site save-rate and MRR preserved across every site running it this month.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="CS-A-XXXX...-XXXX..."
            className="rounded-md border border-strong bg-[var(--bg)] px-3 py-2 font-mono text-[13px]"
          />
          <input
            type="month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-strong bg-[var(--bg)] px-3 py-2 text-[13px]"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-ink"
          >
            {busy ? 'Loading...' : 'Load rollup'}
          </button>
        </div>
        {err ? <p className="mt-3 text-[13px] text-red-600 dark:text-red-400">{err}</p> : null}
      </form>

      {data && data.ok ? (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Sites reporting" value={String(data.totals.site_count)} />
            <Stat label="Attempts" value={data.totals.attempts.toLocaleString()} />
            <Stat label="Save rate" value={formatPct(data.totals.save_rate)} />
            <Stat label="MRR preserved" value={formatMoney(data.totals.mrr_preserved_cents)} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-strong">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--bg-elev)] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Site</th>
                  <th className="px-4 py-2 font-medium">Platform</th>
                  <th className="px-4 py-2 font-medium text-right">Attempts</th>
                  <th className="px-4 py-2 font-medium text-right">Save rate</th>
                  <th className="px-4 py-2 font-medium text-right">MRR preserved</th>
                  <th className="px-4 py-2 font-medium">Plugin</th>
                </tr>
              </thead>
              <tbody>
                {data.sites.map((s) => (
                  <tr key={s.site_url} className="border-t border-soft">
                    <td className="px-4 py-2 font-mono text-[12px]">{s.site_url}</td>
                    <td className="px-4 py-2">{s.platform}</td>
                    <td className="px-4 py-2 text-right">{s.attempts.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{formatPct(s.save_rate)}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatMoney(s.mrr_preserved_cents)}</td>
                    <td className="px-4 py-2 text-muted-2">{s.plugin_version ?? '—'}</td>
                  </tr>
                ))}
                {data.sites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted">
                      No heartbeats for {data.month} yet. Sites push a heartbeat once a day.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-strong p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-2">{label}</div>
      <div className="mt-1 text-2xl font-semibold font-mono">{value}</div>
    </div>
  );
}
