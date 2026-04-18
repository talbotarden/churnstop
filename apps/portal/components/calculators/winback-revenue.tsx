'use client';

import { useMemo, useState } from 'react';

export function WinbackRevenueCalculator() {
  const [cancellations, setCancellations] = useState('120');
  const [reactivationPct, setReactivationPct] = useState('6');
  const [ltv, setLtv] = useState('280');

  const result = useMemo(() => {
    const c = Number(cancellations);
    const r = Number(reactivationPct);
    const l = Number(ltv);
    if (!Number.isFinite(c) || c < 0) return null;
    if (!Number.isFinite(r) || r < 0 || r > 100) return null;
    if (!Number.isFinite(l) || l < 0) return null;
    const reactivated = Math.round(c * (r / 100));
    const monthly = reactivated * l / 12;
    const annual = c * 12 * (r / 100) * l;
    return { reactivated, monthly, annual };
  }, [cancellations, reactivationPct, ltv]);

  return (
    <div className="rounded-xl border border-strong p-6">
      <h2 className="text-[18px] font-semibold tracking-tightish">Winback sequence revenue</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Monthly cancellations" value={cancellations} onChange={setCancellations} />
        <Field label="Winback reactivation rate (%)" value={reactivationPct} onChange={setReactivationPct} step="0.1" />
        <Field label="Reactivated customer LTV ($)" value={ltv} onChange={setLtv} />
      </div>

      {result ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card label="Reactivated / month" value={result.reactivated.toLocaleString()} />
          <Card label="Attributable monthly revenue" value={`$${result.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Card label="Annualised" value={`$${result.annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        </div>
      ) : null}

      <p className="mt-4 text-[12px] text-muted-2">
        Default reactivation assumes a 3-step 7/21/60 day sequence. Typical range is 4–8%. Reactivated-customer LTV is usually 60–80% of a fresh signup because they already churned once.
      </p>
    </div>
  );
}

function Field({ label, value, onChange, step }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] text-muted-2">{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-strong bg-[var(--bg)] px-3 py-2 font-mono text-[14px]"
      />
    </label>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-soft bg-[var(--bg-elev)] p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-2">{label}</div>
      <div className="mt-1 text-[22px] font-semibold font-mono">{value}</div>
    </div>
  );
}
