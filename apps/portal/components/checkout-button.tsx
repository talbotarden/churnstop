'use client';

import { useState } from 'react';

type Props = {
  tier: 'starter' | 'growth' | 'agency';
  cadence?: 'monthly' | 'yearly';
  label: string;
  className?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.churnstop.org';

/**
 * Client-side CTA button that creates a Stripe Checkout Session via the
 * API and redirects the browser to the returned session URL. Gracefully
 * falls back to the /pricing#waitlist anchor when the API responds 503
 * (Stripe not configured) so the CTA never produces a 404.
 */
export function CheckoutButton({ tier, cadence = 'monthly', label, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, cadence }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; session_url: string }
        | { ok: false; error: string }
        | null;

      if (!data) {
        throw new Error('Checkout returned an empty response.');
      }
      if (data.ok === false) {
        if (res.status === 503) {
          // Waitlist fallback: land the user on the waitlist section with
          // the tier pre-selected so the mailto subject is informative.
          window.location.href = `/pricing#waitlist`;
          return;
        }
        throw new Error(data.error || 'Checkout request failed.');
      }
      window.location.href = data.session_url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Checkout failed. Try the waitlist.');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={
          className ??
          'mt-6 rounded-md bg-ink px-4 py-2 text-center text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-ink'
        }
      >
        {busy ? 'Redirecting...' : label}
      </button>
      {err ? (
        <p className="mt-2 text-[12px] text-red-600 dark:text-red-400 text-center">
          {err}{' '}
          <a href="#waitlist" className="underline underline-offset-4">
            Join the waitlist instead
          </a>
        </p>
      ) : null}
    </>
  );
}
