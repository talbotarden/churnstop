'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type SessionResponse =
  | {
      ok: true;
      status: string | null;
      payment_status: string | null;
      customer_email: string | null;
      subscription_id: string | null;
    }
  | { ok: false; error: string };

type LicenseResponse =
  | {
      ok: true;
      license: {
        key: string;
        tier: string;
        status: string;
        email: string;
        expires_at: string | null;
      };
    }
  | { ok: false; error: string };

type View =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'cancelled' }
  | { kind: 'waiting' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; key: string; tier: string; email: string; expiresAt: string | null };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.churnstop.org';
const POLL_INTERVAL_MS = 2000;
const POLL_DEADLINE_MS = 30000;

export function CheckoutResult() {
  const params = useSearchParams();
  const status = params.get('checkout');
  const sessionId = params.get('session_id');
  const [view, setView] = useState<View>({ kind: 'idle' });
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (status === 'cancelled') {
      setView({ kind: 'cancelled' });
      return;
    }
    if (status !== 'success' || !sessionId) {
      setView({ kind: 'idle' });
      return;
    }

    setView({ kind: 'loading' });

    async function run() {
      try {
        const sessionRes = await fetch(`${API_BASE}/checkout/session/${encodeURIComponent(sessionId!)}`);
        const sessionData = (await sessionRes.json().catch(() => null)) as SessionResponse | null;
        if (!sessionData) {
          throw new Error('Checkout session response was empty.');
        }
        if (sessionData.ok === false) {
          throw new Error(sessionData.error);
        }
        if (!sessionData.subscription_id) {
          throw new Error('Checkout completed but no subscription was created. Contact support@churnstop.org.');
        }

        const subId = sessionData.subscription_id;
        const deadline = Date.now() + POLL_DEADLINE_MS;
        while (Date.now() < deadline) {
          if (cancelledRef.current) return;
          const licRes = await fetch(`${API_BASE}/license/by-subscription/${encodeURIComponent(subId)}`);
          if (licRes.ok) {
            const lic = (await licRes.json()) as LicenseResponse;
            if (lic.ok) {
              if (cancelledRef.current) return;
              setView({
                kind: 'ready',
                key: lic.license.key,
                tier: lic.license.tier,
                email: lic.license.email,
                expiresAt: lic.license.expires_at,
              });
              return;
            }
          }
          if (cancelledRef.current) return;
          setView({ kind: 'waiting' });
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }

        if (!cancelledRef.current) {
          setView({
            kind: 'error',
            message:
              'Checkout succeeded but the license is still being provisioned. Refresh this page in a moment, or email support@churnstop.org if this persists.',
          });
        }
      } catch (e) {
        if (cancelledRef.current) return;
        setView({
          kind: 'error',
          message: e instanceof Error ? e.message : 'Checkout lookup failed.',
        });
      }
    }

    run();
    return () => {
      cancelledRef.current = true;
    };
  }, [status, sessionId]);

  if (view.kind === 'idle') return null;

  if (view.kind === 'cancelled') {
    return (
      <section className="mb-10 rounded-xl border border-strong bg-[var(--bg-elev)] p-6">
        <div className="eyebrow">Checkout cancelled</div>
        <h2 className="mt-2 text-[17px] font-semibold tracking-tightish">No charge was made.</h2>
        <p className="mt-2 text-[14px] text-muted leading-relaxed">
          You closed the Stripe checkout before completing payment. You can{' '}
          <a href="/pricing" className="text-accent underline underline-offset-4 hover:no-underline">
            pick a plan
          </a>{' '}
          and try again at any time.
        </p>
      </section>
    );
  }

  if (view.kind === 'loading' || view.kind === 'waiting') {
    return (
      <section className="mb-10 rounded-xl border border-strong surface p-6">
        <div className="eyebrow">Provisioning license</div>
        <h2 className="mt-2 text-[17px] font-semibold tracking-tightish">
          {view.kind === 'loading' ? 'Confirming payment...' : 'Generating your license key...'}
        </h2>
        <p className="mt-2 text-[14px] text-muted leading-relaxed">
          Stripe confirms the charge, then our webhook issues the key. This usually takes a few seconds. Do not close this tab.
        </p>
      </section>
    );
  }

  if (view.kind === 'error') {
    return (
      <section className="mb-10 rounded-xl border border-strong bg-[var(--bg-elev)] p-6">
        <div className="eyebrow">Checkout issue</div>
        <h2 className="mt-2 text-[17px] font-semibold tracking-tightish">We hit a snag pulling your license.</h2>
        <p className="mt-2 text-[14px] text-muted leading-relaxed">{view.message}</p>
      </section>
    );
  }

  return (
    <section className="mb-10 rounded-xl border border-strong surface p-6">
      <div className="eyebrow">Welcome to ChurnStop {view.tier}</div>
      <h2 className="mt-2 text-[17px] font-semibold tracking-tightish">Your license key</h2>
      <p className="mt-2 text-[14px] text-muted leading-relaxed">
        Paste this into ChurnStop -&gt; Settings -&gt; License in WP Admin. We also emailed a copy to{' '}
        <span className="font-medium text-[var(--fg)]">{view.email}</span>.
      </p>
      <div className="mt-4 rounded-md border border-strong bg-[var(--bg)] px-4 py-3 font-mono text-[14px] break-all select-all">
        {view.key}
      </div>
      {view.expiresAt ? (
        <p className="mt-3 text-[12px] text-muted-2">
          Renews {new Date(view.expiresAt).toLocaleDateString()}.
        </p>
      ) : null}
    </section>
  );
}
