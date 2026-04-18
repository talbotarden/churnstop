import { createElement as h, useEffect, useState } from '@wordpress/element';
import { Spinner, Button, Notice } from '@wordpress/components';
import { apiGet, apiPost } from '../api';

type CancelReason = { id: string; label: string; enabled: boolean };

type SettingsShape = {
  modal_heading: string;
  accent_color: string;
  cancel_button_text: string;
  default_discount_percent: number;
  default_discount_cycles: number;
  default_pause_days: number;
  cancel_reasons: CancelReason[];
  open_text_followup: boolean;
  open_text_required: boolean;
};

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ settings: SettingsShape }>('settings')
      .then((data) => {
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function patch<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
    if (!settings) return;

    setSettings({ ...settings, [key]: value });
    setSaveState('dirty');
  }

  function patchReason(index: number, partial: Partial<CancelReason>) {
    if (!settings) return;

    const next = settings.cancel_reasons.slice();
    next[index] = { ...next[index], ...partial };
    patch('cancel_reasons', next);
  }

  function addReason() {
    if (!settings) return;

    patch('cancel_reasons', [
      ...settings.cancel_reasons,
      { id: `reason_${Date.now()}`, label: 'New reason', enabled: true },
    ]);
  }

  function removeReason(index: number) {
    if (!settings) return;

    if (settings.cancel_reasons.length <= 2) {
      window.alert('Keep at least two cancel reasons.');

      return;
    }

    patch('cancel_reasons', settings.cancel_reasons.filter((_, i) => i !== index));
  }

  async function save() {
    if (!settings) return;

    setSaveState('saving');
    setSaveError(null);

    try {
      const res = await apiPost<{ ok: boolean; settings: SettingsShape }>('settings', settings);
      setSettings(res.settings);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e) {
      const err = e as Error & { data?: { violations?: string[]; error?: string } };
      setSaveError(err.data?.violations?.join(' ') ?? err.data?.error ?? err.message);
      setSaveState('error');
    }
  }

  if (loading) return h(Spinner, null);
  if (!settings) return h(Notice, { status: 'error', isDismissible: false }, 'Failed to load settings.');

  return h('div', null,
    h('h1', null, 'Settings'),
    h('p', { className: 'cs-subtitle' }, 'Configure the save-flow modal, default offers, and cancel reasons.'),

    // Branding.
    h('div', { className: 'cs-section' },
      h('h2', null, 'Modal branding'),
      h('p', { className: 'cs-section-help' }, 'Copy and accent color shown to subscribers when they click cancel.'),

      h('div', { className: 'cs-field' },
        h('label', null, 'Modal heading'),
        h('input', {
          type: 'text',
          value: settings.modal_heading,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('modal_heading', e.target.value),
        }),
        h('div', { className: 'cs-field-help' }, 'Shown above the cancel-reason survey. Keep it warm and brief.'),
      ),

      h('div', { className: 'cs-field' },
        h('label', null, 'Accent color'),
        h('input', {
          type: 'color',
          value: settings.accent_color,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('accent_color', e.target.value),
        }),
        h('div', { className: 'cs-field-help' }, 'Used for primary buttons and selected-state borders.'),
      ),
    ),

    // Default offers.
    h('div', { className: 'cs-section' },
      h('h2', null, 'Default offer amounts'),
      h('p', { className: 'cs-section-help' }, 'Applied when no conditional offer matches the selected cancel reason.'),

      h('div', { className: 'cs-row' },
        h('div', { className: 'cs-field' },
          h('label', null, 'Discount %'),
          h('input', {
            type: 'number',
            min: 1,
            max: 90,
            value: settings.default_discount_percent,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('default_discount_percent', Number(e.target.value)),
          }),
          h('div', { className: 'cs-field-help' }, '1 to 90. Typical retention programs run at 20-30%.'),
        ),

        h('div', { className: 'cs-field' },
          h('label', null, 'Discount duration (billing cycles)'),
          h('input', {
            type: 'number',
            min: 1,
            max: 36,
            value: settings.default_discount_cycles,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('default_discount_cycles', Number(e.target.value)),
          }),
          h('div', { className: 'cs-field-help' }, 'How many renewals receive the discount.'),
        ),

        h('div', { className: 'cs-field' },
          h('label', null, 'Pause duration (days)'),
          h('input', {
            type: 'number',
            min: 1,
            max: 180,
            value: settings.default_pause_days,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('default_pause_days', Number(e.target.value)),
          }),
          h('div', { className: 'cs-field-help' }, 'How long to put the subscription on hold.'),
        ),
      ),
    ),

    // Cancel reasons.
    h('div', { className: 'cs-section' },
      h('h2', null, 'Cancel reasons'),
      h('p', { className: 'cs-section-help' }, 'The options subscribers pick from when they click cancel. Keep this list short - every additional question drops save rate by roughly 7%.'),

      settings.cancel_reasons.map((reason, i) =>
        h('div', { className: 'cs-reason-row', key: reason.id },
          h('input', {
            type: 'checkbox',
            checked: reason.enabled,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => patchReason(i, { enabled: e.target.checked }),
            title: 'Enable this reason',
          }),
          h('input', {
            type: 'text',
            value: reason.label,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => patchReason(i, { label: e.target.value }),
          }),
          h('button', {
            type: 'button',
            onClick: () => removeReason(i),
          }, 'Remove'),
        ),
      ),

      h(Button, {
        variant: 'secondary',
        onClick: addReason,
        style: { marginTop: 12 },
      }, '+ Add reason'),

      h('div', { className: 'cs-field', style: { marginTop: 20 } },
        h('label', null,
          h('input', {
            type: 'checkbox',
            checked: settings.open_text_followup,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('open_text_followup', e.target.checked),
          }),
          ' Ask a follow-up open-text question after the reason is selected',
        ),
        h('div', { className: 'cs-field-help' }, 'Optional "anything else?" text box. Keep it optional - required follow-ups tank completion.'),
      ),
    ),

    // Compliance.
    h('div', { className: 'cs-section' },
      h('h2', null, 'Click-to-cancel compliance'),
      h('p', { className: 'cs-section-help' }, 'These rules cannot be turned off. They keep your store aligned with ROSCA and state-level subscription laws.'),

      h('div', { className: 'cs-compliance-notice' },
        h('strong', null, 'Always on:'),
        ' The "No thanks, cancel my subscription" button is visible on every modal screen and completes cancellation in one click. You cannot hide it, rename it to misleading text, or require multiple confirmations.',
      ),

      h('div', { className: 'cs-field', style: { marginTop: 16 } },
        h('label', null, 'Cancel button text'),
        h('input', {
          type: 'text',
          value: settings.cancel_button_text,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch('cancel_button_text', e.target.value),
        }),
        h('div', { className: 'cs-field-help' }, 'Must contain a clear "cancel" indicator. "No thanks, cancel my subscription" is the recommended wording.'),
      ),
    ),

    // Save bar.
    h('div', { className: 'cs-save-bar' },
      h('div', {
        className: `cs-save-status ${saveState === 'saved' ? 'cs-saved' : ''} ${saveState === 'error' ? 'cs-error' : ''}`,
      },
        saveState === 'idle' ? 'All changes saved.' :
        saveState === 'dirty' ? 'You have unsaved changes.' :
        saveState === 'saving' ? 'Saving...' :
        saveState === 'saved' ? 'Saved' :
        saveState === 'error' ? (saveError ?? 'Save failed.') : '',
      ),
      h(Button, {
        variant: 'primary',
        onClick: save,
        disabled: saveState === 'saving' || saveState === 'idle' || saveState === 'saved',
      }, saveState === 'saving' ? 'Saving...' : 'Save changes'),
    ),
  );
}
