/**
 * License screen. Paste a key, activate, see current tier and features.
 * Free tier users can ignore this page entirely; the plugin works fully
 * without a key.
 *
 * The activation endpoint is a WP REST route backed by LicenseManager::activate;
 * this screen does not call api.churnstop.org directly.
 */
import { createElement as h, useEffect, useState } from '@wordpress/element';
import { Spinner, Notice, Button } from '@wordpress/components';
import { apiGet, apiPost } from '../api';

type LicenseStatus = {
  active: boolean;
  tier: string | null;
  features: string[];
  seats: number | null;
  renews_at: string | null;
  site_url: string;
};

type ActivateResponse = { ok: boolean; message?: string; status?: LicenseStatus };

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function License() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    apiGet<LicenseStatus>('license/status')
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setErr(e.message);
        setLoading(false);
      });
  }, []);

  async function activate() {
    if (!key.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiPost<ActivateResponse>('license/activate', { key: key.trim() });
      if (res.ok) {
        setStatus(res.status ?? null);
        setKey('');
        setMsg({ type: 'ok', text: 'License activated. Paid features are now available.' });
      } else {
        setMsg({ type: 'err', text: res.message ?? 'Activation failed.' });
      }
    } catch (e) {
      const error = e as Error & { data?: { message?: string; error?: string } };
      setMsg({ type: 'err', text: error.data?.message ?? error.data?.error ?? error.message });
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!window.confirm('Deactivate this license on this site? Paid features will stop working until a valid license is re-entered.')) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiPost<ActivateResponse>('license/deactivate', {});
      if (res.ok) {
        setStatus(res.status ?? null);
        setMsg({ type: 'ok', text: 'License deactivated on this site.' });
      } else {
        setMsg({ type: 'err', text: res.message ?? 'Deactivation failed.' });
      }
    } catch (e) {
      const error = e as Error;
      setMsg({ type: 'err', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return h(Spinner, null);
  if (err) return h(Notice, { status: 'error', isDismissible: false }, err);

  const isActive = !!status?.active;

  return h('div', null,
    h('h1', null, 'License'),
    h('p', { className: 'cs-subtitle' }, 'Paid-tier license activation. The free tier works fully without a license; paid tiers unlock conditional flows, A/B testing, analytics, and winback.'),

    msg ? h(Notice, { status: msg.type === 'ok' ? 'success' : 'error', isDismissible: true, onRemove: () => setMsg(null) }, msg.text) : null,

    // Status card.
    h('div', { className: 'cs-section' },
      h('h2', null, 'Current status'),
      h('div', { className: 'cs-license-status' },
        isActive
          ? h('div', { className: 'cs-license-active' },
              h('div', { className: 'cs-license-tier' }, (status?.tier ?? 'unknown').toUpperCase()),
              h('div', { className: 'cs-license-meta' },
                status?.renews_at ? `Renews ${fmtDate(status.renews_at)}` : 'Renewal date not reported',
                status?.seats ? ` · ${status.seats} seat${status.seats > 1 ? 's' : ''}` : '',
              ),
              h('div', { className: 'cs-license-features' },
                status?.features.length
                  ? status.features.map((f) =>
                      h('span', { key: f, className: 'cs-license-chip' }, f.replace(/_/g, ' ')),
                    )
                  : h('span', { className: 'cs-license-none' }, 'No features reported.'),
              ),
              h(Button, { variant: 'secondary', onClick: deactivate, disabled: busy, style: { marginTop: 16 } }, 'Deactivate on this site'),
            )
          : h('div', { className: 'cs-license-inactive' },
              h('p', null, 'No license active. Running on the free tier.'),
              h('p', { className: 'cs-field-help' }, 'Paid features (conditional flows, A/B testing, analytics, winback, white-label) are disabled until a license is activated.'),
            ),
      ),
    ),

    // Activation form.
    !isActive
      ? h('div', { className: 'cs-section' },
          h('h2', null, 'Activate a license'),
          h('p', { className: 'cs-section-help' }, 'Paste the license key from your ChurnStop customer portal. Keys start with CS-.'),
          h('div', { className: 'cs-field' },
            h('label', null, 'License key'),
            h('input', {
              type: 'text',
              value: key,
              placeholder: 'CS-XXXXXXXX-XXXXXXXX',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value),
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') activate(); },
              style: { fontFamily: 'ui-monospace, Menlo, monospace' },
            }),
            h('div', { className: 'cs-field-help' }, 'Site URL bound to this license: ', h('code', null, status?.site_url ?? window.location.origin)),
          ),
          h(Button, { variant: 'primary', onClick: activate, disabled: busy || !key.trim() }, busy ? 'Activating...' : 'Activate'),
        )
      : null,

    // What to do if no license yet.
    h('div', { className: 'cs-section' },
      h('h2', null, 'Get a license'),
      h('p', { className: 'cs-section-help' },
        'Keys are issued at checkout from ',
        h('a', { href: 'https://churnstop.org/pricing', target: '_blank', rel: 'noopener noreferrer' }, 'churnstop.org/pricing'),
        '. All paid tiers include a 14-day trial.',
      ),
    ),

    // Privacy note.
    h('div', { className: 'cs-section cs-license-privacy' },
      h('h2', null, 'What gets sent when you activate'),
      h('p', { className: 'cs-section-help' },
        'Exactly three values: the license key, this site\'s URL (home_url()), and the plugin + WordPress version. No subscriber data, no customer emails, no cancellation events are transmitted by license activation. Paid-tier benchmark data is a separate, opt-in path documented in the ',
        h('a', { href: 'https://churnstop.org/privacy', target: '_blank', rel: 'noopener noreferrer' }, 'privacy policy'),
        '.',
      ),
    ),
  );
}
