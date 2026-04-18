/**
 * ChurnStop save-flow modal.
 *
 * Binds to .churnstop-cancel-intercept links on My Account subscription pages.
 * When a customer clicks "Cancel," we intercept, show the survey + offer, and
 * only complete cancellation if they pick "No thanks, cancel my subscription".
 *
 * Click-to-cancel compliance: the cancel button is ALWAYS visible on every
 * screen, is ALWAYS one click from completing cancellation, and the text is
 * never disguised.
 */
import { createElement as h, useEffect, useState, render } from '@wordpress/element';
import './modal.css';

declare const ChurnStop: {
  ajaxUrl: string;
  nonce: string;
  i18n: { noThanksCancel: string; modalHeading: string };
  branding: { accentColor: string };
};

type StepSurvey = {
  type: 'survey';
  config: {
    question: string;
    options: { id: string; label: string }[];
    open_text_followup: boolean;
  };
};

type Offer = {
  type: 'discount' | 'pause' | 'skip_renewal' | 'support_route';
  value?: number;
  duration_days?: number;
  duration_billing_cycles?: number;
};

type StepOffer = { type: 'offer'; offer: Offer };

type Step = StepSurvey | StepOffer;

function CancelModal({ subscriptionId, onClose }: { subscriptionId: number; onClose: () => void }) {
  const [eventId, setEventId] = useState<number | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [reason, setReason] = useState<string>('');
  const [freeText, setFreeText] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [resolution, setResolution] = useState<null | 'saved' | 'cancelled'>(null);

  useEffect(() => {
    (async () => {
      const res = await post('churnstop_start_flow', { subscription_id: subscriptionId });
      if (res?.event_id && res?.step) {
        setEventId(res.event_id);
        setStep(res.step);
      } else {
        // No flow configured; fall through to native cancel.
        await declineAndCancel();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitSurvey() {
    if (!eventId || !reason) return;
    setBusy(true);
    const res = await post('churnstop_submit_survey', { event_id: eventId, reason, free_text: freeText });
    setStep(res.step);
    setBusy(false);
  }

  async function acceptOffer() {
    if (!eventId) return;
    setBusy(true);
    const res = await post('churnstop_accept_offer', { event_id: eventId });
    setBusy(false);
    if (res?.saved) setResolution('saved');
  }

  async function declineAndCancel() {
    if (!eventId) return;
    setBusy(true);
    await post('churnstop_decline_and_cancel', { event_id: eventId });
    setResolution('cancelled');
    setBusy(false);
    // Native cancel has been applied by the backend; reload the page.
    setTimeout(() => window.location.reload(), 1200);
  }

  return h('div', { className: 'churnstop-modal-backdrop', role: 'dialog', 'aria-modal': 'true' },
    h('div', { className: 'churnstop-modal' },
      h('button', {
        className: 'churnstop-modal-close',
        'aria-label': 'Close',
        onClick: onClose,
      }, '\u00D7'),

      resolution === 'saved'
        ? h('div', { className: 'churnstop-success' },
            h('h2', null, 'Thanks for staying!'),
            h('p', null, 'Your subscription has been updated.'),
          )
        : resolution === 'cancelled'
          ? h('div', { className: 'churnstop-done' },
              h('h2', null, 'Cancellation complete'),
              h('p', null, 'We\'ve cancelled your subscription.'),
            )
          : step?.type === 'survey'
            ? h('div', null,
                h('h2', null, step.config.question),
                h('div', { className: 'churnstop-options' },
                  step.config.options.map((opt) =>
                    h('label', { key: opt.id, className: 'churnstop-option' },
                      h('input', {
                        type: 'radio',
                        name: 'reason',
                        value: opt.id,
                        checked: reason === opt.id,
                        onChange: () => setReason(opt.id),
                      }),
                      h('span', null, opt.label),
                    ),
                  ),
                ),
                step.config.open_text_followup && reason
                  ? h('textarea', {
                      placeholder: 'Anything else? (optional)',
                      value: freeText,
                      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setFreeText(e.target.value),
                      rows: 3,
                    })
                  : null,
                h('div', { className: 'churnstop-actions' },
                  h('button', {
                    className: 'button button-primary',
                    disabled: !reason || busy,
                    onClick: submitSurvey,
                  }, 'Continue'),
                  // Compliance: no-thanks-cancel is ALWAYS visible.
                  h('button', {
                    className: 'button churnstop-cancel-anyway',
                    onClick: declineAndCancel,
                    disabled: busy,
                  }, ChurnStop.i18n.noThanksCancel),
                ),
              )
            : step?.type === 'offer'
              ? h('div', null,
                  h('h2', null, offerHeading(step.offer)),
                  h('p', null, offerDescription(step.offer)),
                  h('div', { className: 'churnstop-actions' },
                    h('button', {
                      className: 'button button-primary',
                      onClick: acceptOffer,
                      disabled: busy,
                    }, offerAcceptLabel(step.offer)),
                    // Compliance: no-thanks-cancel is ALWAYS visible.
                    h('button', {
                      className: 'button churnstop-cancel-anyway',
                      onClick: declineAndCancel,
                      disabled: busy,
                    }, ChurnStop.i18n.noThanksCancel),
                  ),
                )
              : h('p', null, 'Loading...'),
    ),
  );
}

function offerHeading(offer: Offer): string {
  if (offer.type === 'discount') return `Save ${offer.value ?? 20}% for the next ${offer.duration_billing_cycles ?? 3} renewals`;
  if (offer.type === 'pause') return `Take a ${offer.duration_days ?? 30}-day break instead`;
  if (offer.type === 'skip_renewal') return 'Skip your next renewal';
  return 'We can help';
}

function offerDescription(offer: Offer): string {
  if (offer.type === 'discount') return 'Your subscription continues at the discounted rate. You can cancel any time.';
  if (offer.type === 'pause') return 'We\'ll pause your subscription and resume it automatically when the pause ends.';
  if (offer.type === 'skip_renewal') return 'Your next renewal date is pushed out one billing cycle. You stay subscribed with no charge this cycle.';
  return '';
}

function offerAcceptLabel(offer: Offer): string {
  if (offer.type === 'discount') return 'Accept discount';
  if (offer.type === 'pause') return 'Pause subscription';
  if (offer.type === 'skip_renewal') return 'Skip next renewal';
  return 'Accept';
}

async function post(action: string, payload: Record<string, string | number>) {
  const body = new URLSearchParams({ action, nonce: ChurnStop.nonce, ...stringifyAll(payload) });
  const res = await fetch(ChurnStop.ajaxUrl, { method: 'POST', body });
  const json = await res.json();
  return json?.data ?? null;
}

function stringifyAll(obj: Record<string, string | number>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));
}

// Attach.
document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('.churnstop-cancel-intercept') as HTMLElement | null;
  if (!target) return;
  e.preventDefault();

  const subscriptionId = Number(target.getAttribute('data-subscription-id')) || 0;
  if (!subscriptionId) return;

  const mount = document.createElement('div');
  mount.className = 'churnstop-modal-mount';

  // Apply the merchant's accent color as a CSS variable so primary buttons use it.
  if (ChurnStop.branding?.accentColor) {
    mount.style.setProperty('--churnstop-accent', ChurnStop.branding.accentColor);
  }

  document.body.appendChild(mount);

  const close = () => {
    render(null, mount);
    mount.remove();
  };

  render(h(CancelModal, { subscriptionId, onClose: close }), mount);
});
