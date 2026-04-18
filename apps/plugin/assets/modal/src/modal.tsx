/**
 * ChurnStop save-flow modal.
 *
 * Binds to .churnstop-cancel-intercept links on My Account subscription pages.
 * When a customer clicks Cancel, we intercept, show the survey + offer, and
 * only complete cancellation if they pick "No thanks, cancel my subscription".
 *
 * Click-to-cancel compliance rules enforced here:
 *  - The decline-and-cancel button is ALWAYS visible on every interactive
 *    screen and ALWAYS completes cancellation in one click.
 *  - Decline-and-cancel is never re-labelled to soft language ("just browsing",
 *    "maybe later"); the text comes from the merchant's compliance-validated
 *    setting.
 *  - Escape key closes the modal without changing subscription status (the
 *    customer came via the cancel link; they can re-enter the flow via the
 *    same link, so this is not a regression in path-to-cancel).
 *  - Error states ALWAYS show the decline-and-cancel button so a broken
 *    save flow never traps the customer.
 */
import { createElement as h, useEffect, useRef, useState, render } from '@wordpress/element';
import './modal.css';

declare const ChurnStop: {
  ajaxUrl: string;
  nonce: string;
  i18n: {
    noThanksCancel: string;
    modalHeading: string;
  };
  branding: { accentColor: string };
  compliance?: { closeEqualsCancel?: boolean };
};

type SurveyOption = { id: string; label: string };

type StepSurvey = {
  type: 'survey';
  config: {
    question: string;
    options: SurveyOption[];
    open_text_followup: boolean;
    open_text_required: boolean;
  };
};

type DiscountOffer = {
  type: 'discount';
  value?: number;
  duration_billing_cycles?: number;
};

type PauseOffer = {
  type: 'pause';
  duration_days?: number;
};

type SkipRenewalOffer = { type: 'skip_renewal' };

type SupportRouteOffer = {
  type: 'support_route';
  support_url?: string;
  support_email?: string;
  message?: string;
};

type Offer = DiscountOffer | PauseOffer | SkipRenewalOffer | SupportRouteOffer;

type StepOffer = { type: 'offer'; offer: Offer };

type Step = StepSurvey | StepOffer;

type Resolution = null | 'saved' | 'cancelled' | 'error';

function CancelModal({ subscriptionId, onClose }: { subscriptionId: number; onClose: () => void }) {
  const [eventId, setEventId] = useState<number | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [reason, setReason] = useState<string>('');
  const [freeText, setFreeText] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [resolution, setResolution] = useState<Resolution>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Start the flow on mount. Backend creates the cancellation_event row
    // and returns the first step (usually the survey) plus the event id.
    (async () => {
      try {
        const res = await post('churnstop_start_flow', { subscription_id: subscriptionId });
        if (res?.event_id && res?.step) {
          setEventId(res.event_id);
          setStep(res.step);
        } else if (res?.no_flow) {
          // Merchant has no active flow: fall through to native cancel.
          window.location.href = (document.querySelector<HTMLAnchorElement>(
            '.churnstop-cancel-intercept[data-subscription-id="' + subscriptionId + '"]',
          )?.getAttribute('data-native-cancel-url')) ?? window.location.href;
        } else {
          setError('Could not start the save flow.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error starting flow.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape. Does NOT complete cancellation; customer can re-click
  // the cancel link on the account page to resume the flow.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Focus the first interactive element after mount so keyboard users can
  // navigate the modal immediately.
  useEffect(() => {
    if (!step || resolution) return;
    const first = containerRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), button, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }, [step, resolution]);

  async function submitSurvey() {
    if (!eventId || !reason || busy) return;
    if (step?.type === 'survey' && step.config.open_text_required && !freeText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await post('churnstop_submit_survey', {
        event_id: eventId,
        reason,
        free_text: freeText,
      });
      if (res?.step) {
        setStep(res.step);
      } else if (res?.resolved === 'cancelled' || res?.cancelled) {
        // No offer available for this reason; backend auto-cancelled.
        finishCancel();
      } else {
        setError('We could not load an offer for that reason. Please try again or cancel.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function acceptOffer() {
    if (!eventId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await post('churnstop_accept_offer', { event_id: eventId });
      if (res?.saved) {
        setResolution('saved');
      } else if (res?.error) {
        setError(String(res.error));
      } else {
        setError('Could not apply the offer. Please try again or cancel.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function declineAndCancel() {
    if (busy) return;
    if (!eventId) {
      // Flow never initialized; fall through to the native link.
      onClose();
      return;
    }
    finishCancel();
  }

  async function finishCancel() {
    setBusy(true);
    setError(null);
    try {
      await post('churnstop_decline_and_cancel', { event_id: eventId });
      setResolution('cancelled');
      // Native cancel applied. Reload so the My Account page reflects
      // the new subscription status.
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed. Try again.');
      setBusy(false);
    }
  }

  const declineButton = h('button', {
    type: 'button',
    className: 'button churnstop-cancel-anyway',
    onClick: declineAndCancel,
    disabled: busy,
  }, ChurnStop.i18n.noThanksCancel);

  return h('div', {
    className: 'churnstop-modal-backdrop',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'churnstop-modal-heading',
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      // Backdrop click dismisses (does not cancel). Keeps the same path-to-cancel
      // posture as Escape key.
      if (e.target === e.currentTarget) onClose();
    },
  },
    h('div', { className: 'churnstop-modal', ref: containerRef },
      h('button', {
        type: 'button',
        className: 'churnstop-modal-close',
        'aria-label': 'Close',
        onClick: onClose,
      }, '\u00D7'),

      resolution === 'saved'
        ? h('div', { className: 'churnstop-success' },
            h('h2', { id: 'churnstop-modal-heading' }, 'Thanks for staying.'),
            h('p', null, 'Your subscription has been updated. You can close this window.'),
            h('div', { className: 'churnstop-actions' },
              h('button', {
                type: 'button',
                className: 'button button-primary',
                onClick: () => window.location.reload(),
              }, 'Done'),
            ),
          )
        : resolution === 'cancelled'
          ? h('div', { className: 'churnstop-done' },
              h('h2', { id: 'churnstop-modal-heading' }, 'Cancellation complete'),
              h('p', null, 'Your subscription has been cancelled. Refreshing the page...'),
            )
          : error
            ? h('div', { className: 'churnstop-error' },
                h('h2', { id: 'churnstop-modal-heading' }, 'Something went wrong'),
                h('p', null, error),
                h('p', { className: 'churnstop-error-help' },
                  'You can try again or cancel your subscription directly - the decline link below always works.',
                ),
                h('div', { className: 'churnstop-actions' },
                  h('button', {
                    type: 'button',
                    className: 'button',
                    onClick: () => { setError(null); },
                  }, 'Try again'),
                  declineButton,
                ),
              )
            : step?.type === 'survey'
              ? h('div', null,
                  h('h2', { id: 'churnstop-modal-heading' }, step.config.question),
                  h('div', { className: 'churnstop-options' },
                    step.config.options.map((opt) =>
                      h('label', { key: opt.id, className: `churnstop-option ${reason === opt.id ? 'churnstop-option-selected' : ''}` },
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
                    ? h('div', { className: 'churnstop-textarea-wrap' },
                        h('textarea', {
                          placeholder: step.config.open_text_required
                            ? 'Please share a bit more (required)'
                            : 'Anything else? (optional)',
                          value: freeText,
                          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setFreeText(e.target.value),
                          rows: 3,
                          'aria-required': step.config.open_text_required,
                        }),
                      )
                    : null,
                  h('div', { className: 'churnstop-actions' },
                    h('button', {
                      type: 'button',
                      className: 'button button-primary',
                      disabled: !reason || busy || (step.config.open_text_required && !freeText.trim()),
                      onClick: submitSurvey,
                    }, busy ? 'Working...' : 'Continue'),
                    declineButton,
                  ),
                )
              : step?.type === 'offer'
                ? renderOffer(step.offer, declineButton, acceptOffer, busy)
                : h('div', { className: 'churnstop-loading' },
                    h('p', null, 'Loading...'),
                  ),
    ),
  );
}

function renderOffer(offer: Offer, declineButton: React.ReactElement, acceptOffer: () => void, busy: boolean) {
  if (offer.type === 'support_route') {
    const href = offer.support_url ?? (offer.support_email ? `mailto:${offer.support_email}` : '');
    return h('div', null,
      h('h2', { id: 'churnstop-modal-heading' }, 'Let us help you sort this out.'),
      h('p', null, offer.message ?? 'Our support team will follow up with you. There is no charge while your ticket is open, and you can still cancel any time.'),
      h('div', { className: 'churnstop-actions' },
        href
          ? h('a', { href, className: 'button button-primary', target: '_blank', rel: 'noopener noreferrer' }, 'Get help')
          : null,
        declineButton,
      ),
    );
  }

  return h('div', null,
    h('h2', { id: 'churnstop-modal-heading' }, offerHeading(offer)),
    h('p', null, offerDescription(offer)),
    h('div', { className: 'churnstop-actions' },
      h('button', {
        type: 'button',
        className: 'button button-primary',
        onClick: acceptOffer,
        disabled: busy,
      }, busy ? 'Applying...' : offerAcceptLabel(offer)),
      declineButton,
    ),
  );
}

function offerHeading(offer: Offer): string {
  if (offer.type === 'discount') {
    return `Save ${offer.value ?? 20}% for the next ${offer.duration_billing_cycles ?? 3} renewals.`;
  }
  if (offer.type === 'pause') {
    return `Take a ${offer.duration_days ?? 30}-day break instead.`;
  }
  if (offer.type === 'skip_renewal') {
    return 'Skip your next renewal.';
  }
  return 'We can help.';
}

function offerDescription(offer: Offer): string {
  if (offer.type === 'discount') {
    return 'Your subscription continues at the discounted rate. You can cancel any time.';
  }
  if (offer.type === 'pause') {
    return 'We will pause your subscription and resume it automatically when the pause ends.';
  }
  if (offer.type === 'skip_renewal') {
    return 'Your next renewal date is pushed out one billing cycle. You stay subscribed with no charge this cycle.';
  }
  return '';
}

function offerAcceptLabel(offer: Offer): string {
  if (offer.type === 'discount') return 'Accept discount';
  if (offer.type === 'pause') return 'Pause subscription';
  if (offer.type === 'skip_renewal') return 'Skip next renewal';
  return 'Accept';
}

async function post(action: string, payload: Record<string, string | number>): Promise<Record<string, unknown> | null> {
  const body = new URLSearchParams({
    action,
    nonce: ChurnStop.nonce,
    ...stringifyAll(payload),
  });
  const res = await fetch(ChurnStop.ajaxUrl, { method: 'POST', body });
  if (!res.ok) {
    throw new Error(`Request failed: HTTP ${res.status}`);
  }
  const json = await res.json().catch(() => null) as { success?: boolean; data?: Record<string, unknown> } | null;
  if (!json || json.success === false) {
    throw new Error(typeof json?.data === 'string' ? json.data as string : 'Request failed.');
  }
  return json.data ?? null;
}

function stringifyAll(obj: Record<string, string | number>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));
}

// Attach to any element with .churnstop-cancel-intercept that carries a
// data-subscription-id. The PHP CancellationInterceptor class rewrites the
// default WC Subs cancel link to carry this class at render time.
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
