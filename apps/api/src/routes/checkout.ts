/**
 * Stripe checkout session creation. The marketing site's /pricing page CTAs
 * POST to /checkout with a tier and cadence; this endpoint creates a Stripe
 * Checkout session bound to the configured price id and returns the session
 * URL. The portal redirects the customer to that URL.
 *
 * Idempotent-safe: Stripe checkout sessions are safe to recreate - if the
 * user refreshes the page the previous session expires after 24h. We do
 * not reuse session ids across requests.
 *
 * The license record is NOT created here; it's created by the webhook when
 * Stripe confirms payment. See src/routes/webhooks/stripe.ts.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { isConfigured, stripeClient } from '../lib/stripe.js';
import { isTier, tierToPriceId, PLANS } from '../entitlements.js';

const createSchema = z.object({
  tier: z.enum(['starter', 'growth', 'agency']),
  cadence: z.enum(['monthly', 'yearly']).default('monthly'),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  email: z.string().email().optional(),
});

export const checkoutRoutes = new Hono();

checkoutRoutes.post('/', zValidator('json', createSchema), async (c) => {
  if (!isConfigured()) {
    return c.json(
      {
        ok: false,
        error: 'Stripe is not configured on this environment yet. Join the waitlist at https://churnstop.org/pricing#waitlist and we will notify you when paid checkout opens.',
      },
      503,
    );
  }

  const { tier, cadence, success_url, cancel_url, email } = c.req.valid('json');

  if (!isTier(tier)) {
    return c.json({ ok: false, error: 'Checkout is only available for paid tiers.' }, 400);
  }

  const priceId = tierToPriceId(tier, cadence);
  if (!priceId) {
    return c.json(
      {
        ok: false,
        error: `Stripe price id for ${tier}/${cadence} is not configured. Set STRIPE_PRICE_${tier.toUpperCase()}_${cadence.toUpperCase()} in apps/api/.env.`,
      },
      503,
    );
  }

  const plan = PLANS[tier];
  const siteBase = process.env.MARKETING_SITE_URL ?? 'https://churnstop.org';

  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      customer_email: email,
      client_reference_id: `${tier}:${cadence}`,
      metadata: {
        tier,
        cadence,
        plan_label: plan.label,
      },
      subscription_data: {
        metadata: {
          tier,
          cadence,
        },
      },
      success_url: success_url ?? `${siteBase}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url ?? `${siteBase}/pricing?checkout=cancelled`,
    });

    return c.json({
      ok: true,
      session_id: session.id,
      session_url: session.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe request failed.';
    return c.json({ ok: false, error: message }, 502);
  }
});

checkoutRoutes.get('/session/:id', async (c) => {
  if (!isConfigured()) {
    return c.json({ ok: false, error: 'Stripe not configured.' }, 503);
  }
  const sessionId = c.req.param('id');
  try {
    const session = await stripeClient().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
    return c.json({
      ok: true,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: typeof session.customer_details?.email === 'string' ? session.customer_details.email : null,
      subscription_id:
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe request failed.';
    return c.json({ ok: false, error: message }, 502);
  }
});
