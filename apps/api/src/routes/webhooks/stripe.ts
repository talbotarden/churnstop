/**
 * Stripe webhook receiver. The one endpoint Stripe calls with every billing
 * lifecycle event. We care about:
 *
 *  - checkout.session.completed: create the license row (if not already
 *    present for this subscription), generate the key, email it to the
 *    customer.
 *  - customer.subscription.updated: sync tier + status + expiry.
 *  - customer.subscription.deleted: mark the license cancelled.
 *  - invoice.payment_failed: mark license past_due.
 *
 * Signature verification is MANDATORY. We never accept webhook payloads that
 * do not validate against the shared STRIPE_WEBHOOK_SECRET.
 */

import { Hono } from 'hono';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';

import { db, schema } from '../../db/client.js';
import { stripeClient, webhookSecret } from '../../lib/stripe.js';
import { generateLicenseKey } from '../../lib/keygen.js';
import { isTier, priceIdToTier } from '../../entitlements.js';

export const stripeWebhookRoutes = new Hono();

stripeWebhookRoutes.post('/', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ ok: false, error: 'Missing stripe-signature header.' }, 400);
  }

  let body: string;
  try {
    body = await c.req.text();
  } catch {
    return c.json({ ok: false, error: 'Cannot read request body.' }, 400);
  }

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(body, signature, webhookSecret());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed.';
    return c.json({ ok: false, error: `Webhook verification failed: ${message}` }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled events are ACKed successfully so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // Fail the webhook so Stripe retries with exponential backoff. Log to
    // whatever observability is configured; for now, console so it surfaces.
    // eslint-disable-next-line no-console
    console.error('[stripe webhook] handler failed', event.type, err);
    return c.json({ ok: false, error: 'Internal error handling webhook.' }, 500);
  }

  return c.json({ ok: true, received: event.type });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return;

  const email = session.customer_details?.email ?? null;
  if (!email) return;

  const subscription = await stripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const tier = priceIdToTier(priceId);
  if (!tier || !isTier(tier)) return;

  // Idempotency: if a license already exists for this subscription id, do not
  // recreate. Webhooks can be retried.
  const existing = await db
    .select()
    .from(schema.licenses)
    .where(eq(schema.licenses.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (existing[0]) return;

  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  // Generate a key; retry up to 3 times in the astronomically unlikely case of
  // a collision (32^16 bits of entropy per block; collisions never happen in
  // practice but the retry guards against test-mode key reuse).
  let key = generateLicenseKey(tier);
  for (let i = 0; i < 3; i++) {
    const clash = await db
      .select({ id: schema.licenses.id })
      .from(schema.licenses)
      .where(eq(schema.licenses.key, key))
      .limit(1);
    if (!clash[0]) break;
    key = generateLicenseKey(tier);
  }

  const expiresAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  await db.insert(schema.licenses).values({
    key,
    email,
    tier,
    status: subscription.status === 'trialing' ? 'trialing' : 'active',
    seats: 1,
    stripeCustomerId,
    stripeSubscriptionId: subscriptionId,
    expiresAt,
  });

  // Email delivery intentionally deferred here - the portal's /account page
  // reads the license by email (or by session_id lookup) and displays the key.
  // Transactional email is a separate concern that lands with the winback
  // email infrastructure; when that is wired, bind an action here to send
  // the key via Postmark.
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? priceIdToTier(priceId) : null;

  const expiresAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const update: Record<string, unknown> = {
    status: mapStripeStatus(subscription.status),
  };
  if (tier) update.tier = tier;
  if (expiresAt) update.expiresAt = expiresAt;

  await db
    .update(schema.licenses)
    .set(update)
    .where(eq(schema.licenses.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  await db
    .update(schema.licenses)
    .set({ status: 'cancelled' })
    .where(eq(schema.licenses.stripeSubscriptionId, subscription.id));
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  await db
    .update(schema.licenses)
    .set({ status: 'past_due' })
    .where(eq(schema.licenses.stripeSubscriptionId, subscriptionId));
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'cancelled';
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
      return 'cancelled';
    case 'paused':
      return 'paused';
    default:
      return status;
  }
}
