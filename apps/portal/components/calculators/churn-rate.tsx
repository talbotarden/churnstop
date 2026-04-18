'use client';

import { useMemo, useState } from 'react';

/**
 * Monthly gross churn = cancellations / starting_subscribers.
 * New signups deliberately do NOT go in the denominator — that is the
 * common mistake this calculator is designed to prevent.
 */
export function ChurnRateCalculator() {
  const [startSubs, setStartSubs] = useState('1200');
  const [cancellations, setCancellations] = useState('60');
  const [newSignups, setNewSignups] = useState('150');

  const result = useMemo(() => {
    const s = Number(startSubs);
    const c = Number(cancellations);
    const n = Number(newSignups);
    if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(c) || c < 0) {
      return null;
    }
    const churn = c / s;
    const endSubs = s - c + (Number.isFinite(n) ? n : 0);
    return { churn, endSubs };
  }, [startSubs, cancellations, newSignups]);

  return (
    <div className="rounded-xl border border-strong p-6">
      <h2 className="text-[18px] font-semibold tracking-tightish">Calculate monthly churn</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Starting subscribers" value={startSubs} onChange={setStartSubs} />
        <Field label="Cancellations this month" value={cancellations} onChange={setCancellations} />
        <Field label="New signups this month" value={newSignups} onChange={setNewSignups} />
      </div>

      {result ? (
        <div className="mt-6 rounded-xl border border-soft bg-[var(--bg-elev)] p-5">
          <div className="text-[11px] uppercase tracking-wide text-muted-2">Monthly gross churn</div>
          <div className="mt-1 text-[32px] font-semibold font-mono">
            {(result.churn * 100).toFixed(2)}%
          </div>
          <p className="mt-2 text-[13px] text-muted">
            {cancellations} / {startSubs} = {(result.churn * 100).toFixed(2)}%. Ending subscribers: {result.endSubs.toLocaleString()}.
          </p>
          <p className="mt-3 text-[12px] text-muted-2">
            Note: new signups are deliberately excluded from the denominator. Dividing by ending subscribers (start - cancellations + new) artificially lowers the number and hides churn problems.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] text-muted-2">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-strong bg-[var(--bg)] px-3 py-2 font-mono text-[14px]"
      />
    </label>
  );
}
