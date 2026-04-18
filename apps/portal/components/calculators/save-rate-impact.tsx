'use client';

import { useMemo, useState } from 'react';

const SAVE_RATES = [0.1, 0.2, 0.3, 0.4];

export function SaveRateImpactCalculator() {
  const [attempts, setAttempts] = useState('200');
  const [arpu, setArpu] = useState('49');

  const rows = useMemo(() => {
    const a = Number(attempts);
    const r = Number(arpu);
    if (!Number.isFinite(a) || a < 0 || !Number.isFinite(r) || r < 0) return null;
    return SAVE_RATES.map((s) => {
      const saves = Math.round(a * s);
      const monthly = saves * r;
      const annual = monthly * 12;
      return { saveRate: s, saves, monthly, annual };
    });
  }, [attempts, arpu]);

  return (
    <div className="rounded-xl border border-strong p-6">
      <h2 className="text-[18px] font-semibold tracking-tightish">Save rate -&gt; MRR preserved</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Cancel attempts per month" value={attempts} onChange={setAttempts} />
        <Field label="Average monthly subscription value ($)" value={arpu} onChange={setArpu} />
      </div>

      {rows ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-soft">
          <table className="w-full text-[14px]">
            <thead className="bg-[var(--bg-elev)] text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Save rate</th>
                <th className="px-4 py-2 font-medium text-right">Saves / mo</th>
                <th className="px-4 py-2 font-medium text-right">MRR preserved</th>
                <th className="px-4 py-2 font-medium text-right">Annualised</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.saveRate} className="border-t border-soft">
                  <td className="px-4 py-2 font-mono">{(r.saveRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-mono">{r.saves.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono">${r.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-2 text-right font-mono">${r.annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-4 text-[12px] text-muted-2">
        Typical save rates by category: subscription boxes 35–45%, replenishment 40–55%, memberships 25–35%, SaaS 20–30%, paid newsletters 20–28%.
      </p>
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
