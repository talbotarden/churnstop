'use client';

import { useMemo, useState } from 'react';

/**
 * LTV = ARPU / churn_rate.
 * A 1-point churn reduction on a 5% baseline cuts churn from 5% to 4% —
 * which raises LTV by 25%. The point of this calculator is to make
 * that math visible.
 */
export function LtvLiftCalculator() {
  const [churn, setChurn] = useState('5');
  const [reduction, setReduction] = useState('1');
  const [arpu, setArpu] = useState('49');

  const result = useMemo(() => {
    const c = Number(churn);
    const r = Number(reduction);
    const a = Number(arpu);
    if (!Number.isFinite(c) || c <= 0 || c > 100) return null;
    if (!Number.isFinite(r) || r < 0) return null;
    if (!Number.isFinite(a) || a <= 0) return null;
    const newChurn = Math.max(0.1, c - r);
    const ltvBefore = a / (c / 100);
    const ltvAfter = a / (newChurn / 100);
    const lift = ltvAfter - ltvBefore;
    const liftPct = lift / ltvBefore;
    return { ltvBefore, ltvAfter, lift, liftPct, newChurn };
  }, [churn, reduction, arpu]);

  return (
    <div className="rounded-xl border border-strong p-6">
      <h2 className="text-[18px] font-semibold tracking-tightish">Churn reduction -&gt; LTV lift</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Current monthly churn (%)" value={churn} onChange={setChurn} step="0.1" />
        <Field label="Expected reduction (percentage points)" value={reduction} onChange={setReduction} step="0.1" />
        <Field label="ARPU (monthly $)" value={arpu} onChange={setArpu} step="1" />
      </div>

      {result ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card label="LTV before" value={`$${result.ltvBefore.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Card label={`LTV after (${result.newChurn.toFixed(1)}% churn)`} value={`$${result.ltvAfter.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Card label="Lift" value={`+$${result.lift.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(result.liftPct * 100).toFixed(1)}%)`} />
        </div>
      ) : null}

      <p className="mt-4 text-[12px] text-muted-2">
        Formula: LTV = ARPU / monthly_churn. This is the contractual LTV (infinite horizon). For a more conservative number, cap the horizon at 36 months.
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
