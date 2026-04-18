/**
 * White-label branding screen. Agency plan only. Lets the reseller
 * override the product name, logo URL, accent color, support email,
 * and the admin footer credit. Clearing a field returns to the
 * ChurnStop default.
 */
import { createElement as h, Fragment, useEffect, useState } from '@wordpress/element';
import { apiGet, apiPost } from '../api';

type Branding = {
  product_name: string;
  company_name: string;
  logo_url: string;
  accent_color: string;
  support_email: string;
  hide_ab_tests: boolean;
  footer_credit: string;
};

type BrandingResponse = {
  enabled: boolean;
  branding: Branding;
};

export function Branding() {
  const [form, setForm] = useState<Branding | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<BrandingResponse>('branding');
        setEnabled(data.enabled);
        setForm(data.branding);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed to load branding.');
      }
    })();
  }, []);

  if (err) {
    return h('div', null,
      h('h1', null, 'Branding'),
      h('div', { className: 'notice notice-error', style: { padding: '8px 12px' } }, err),
    );
  }

  if (!form) {
    return h('div', null, h('p', null, 'Loading...'));
  }

  if (!enabled) {
    return h('div', null,
      h('h1', null, 'Branding'),
      h('p', null, 'White-label branding requires an Agency plan.'),
    );
  }

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      await apiPost('branding', form);
      setSaved(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  const update = <K extends keyof Branding>(key: K, value: Branding[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return h(Fragment, null,
    h('h1', null, 'Branding'),
    h('p', { className: 'cs-subtitle' },
      'Agency white-label. Replace the product name, logo, and footer credit across the admin UI. ',
      'The cancellation modal is already merchant-configurable via Settings and is not affected here.',
    ),
    saved ? h('div', { className: 'notice notice-success', style: { padding: '8px 12px' } }, 'Branding saved. Reload to see menu changes.') : null,
    h('form', { onSubmit: submit, style: { maxWidth: 640 } },
      field('Product name', h('input', {
        type: 'text',
        value: form.product_name,
        onChange: (ev: { target: HTMLInputElement }) => update('product_name', ev.target.value),
        style: { width: '100%' },
      })),
      field('Company name', h('input', {
        type: 'text',
        value: form.company_name,
        onChange: (ev: { target: HTMLInputElement }) => update('company_name', ev.target.value),
        style: { width: '100%' },
      })),
      field('Logo URL', h('input', {
        type: 'url',
        value: form.logo_url,
        placeholder: 'https://...',
        onChange: (ev: { target: HTMLInputElement }) => update('logo_url', ev.target.value),
        style: { width: '100%' },
      })),
      field('Accent color (hex)', h('input', {
        type: 'text',
        value: form.accent_color,
        placeholder: '#0f1419',
        onChange: (ev: { target: HTMLInputElement }) => update('accent_color', ev.target.value),
        style: { width: 160 },
      })),
      field('Support email', h('input', {
        type: 'email',
        value: form.support_email,
        onChange: (ev: { target: HTMLInputElement }) => update('support_email', ev.target.value),
        style: { width: '100%' },
      })),
      field('Footer credit (HTML allowed)', h('textarea', {
        rows: 3,
        value: form.footer_credit,
        onChange: (ev: { target: HTMLTextAreaElement }) => update('footer_credit', ev.target.value),
        style: { width: '100%', fontFamily: 'monospace' },
      })),
      h('p', null,
        h('label', null,
          h('input', {
            type: 'checkbox',
            checked: form.hide_ab_tests,
            onChange: (ev: { target: HTMLInputElement }) => update('hide_ab_tests', ev.target.checked),
          }),
          ' Hide A/B Tests menu item (use when your end-customers should not see experiment tooling)',
        ),
      ),
      h('button', { type: 'submit', className: 'button button-primary', disabled: busy }, busy ? 'Saving...' : 'Save branding'),
    ),
  );
}

function field(label: string, control: unknown) {
  return h('p', null,
    h('label', { style: { display: 'block', fontWeight: 600, marginBottom: 4 } }, label),
    control,
  );
}
