/**
 * License verification + entitlements endpoints. Called by the WordPress
 * plugin's LicenseManager on activation and every 12 hours to refresh.
 *
 * Verify flow:
 *   POST /license/verify  { platform, key, site_url }
 *     - validates key format and platform enum
 *     - looks up the license row
 *     - enforces the tier's site-activation cap by checking / inserting into
 *       license_activations
 *     - returns entitlements derived from the plan's features set
 *
 *   POST /license/entitlements { platform, key, site_url }
 *     - same validation, but does not mutate activations (read-only refresh)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { db, schema } from '../db/client.js';
import { entitlementsForTier, isTier } from '../entitlements.js';
import { isValidKeyFormat } from '../lib/keygen.js';

// PLATFORM_ADAPTER: extend SUPPORTED_PLATFORMS when adding a new adapter under
// apps/api/src/adapters/.
const SUPPORTED_PLATFORMS = ['woocommerce'] as const;

const verifySchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS, {
    errorMap: () => ({
      message: `unsupported_platform - phase 1 supports: ${SUPPORTED_PLATFORMS.join(', ')}`,
    }),
  }),
  key: z.string().min(10),
  site_url: z.string().url(),
});

export const licenseRoutes = new Hono();

async function resolveAndValidate(key: string) {
  if (!isValidKeyFormat(key)) {
    return { ok: false, error: 'Invalid license key format.' } as const;
  }

  const rows = await db
    .select()
    .from(schema.licenses)
    .where(eq(schema.licenses.key, key))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { ok: false, error: 'License key not found.' } as const;
  }

  if (!isTier(row.tier)) {
    return { ok: false, error: 'License tier is invalid; contact support.' } as const;
  }

  if (row.status !== 'active' && row.status !== 'trialing') {
    return { ok: false, error: `License is ${row.status}.` } as const;
  }

  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: 'License has expired.' } as const;
  }

  return { ok: true, row } as const;
}

licenseRoutes.post('/verify', zValidator('json', verifySchema), async (c) => {
  const { key, site_url: siteUrl } = c.req.valid('json');

  const resolved = await resolveAndValidate(key);
  if (!resolved.ok) {
    return c.json({ ok: false, error: resolved.error }, 400);
  }
  const row = resolved.row;

  // Enforce site-activation cap. Check if this site already activated under
  // this license; if not, confirm we are under the cap before inserting.
  const existing = await db
    .select()
    .from(schema.licenseActivations)
    .where(
      and(
        eq(schema.licenseActivations.licenseId, row.id),
        eq(schema.licenseActivations.siteUrl, siteUrl),
      ),
    )
    .limit(1);

  if (existing[0]) {
    // Refresh lastSeenAt so merchants can see when each site checked in.
    await db
      .update(schema.licenseActivations)
      .set({ lastSeenAt: new Date() })
      .where(eq(schema.licenseActivations.id, existing[0].id));
  } else {
    const activations = await db
      .select({ id: schema.licenseActivations.id })
      .from(schema.licenseActivations)
      .where(eq(schema.licenseActivations.licenseId, row.id));

    const ent = entitlementsForTier(row.tier as 'free' | 'starter' | 'growth' | 'agency');
    if (activations.length >= ent.maxSites) {
      return c.json(
        {
          ok: false,
          error: `This license is activated on ${activations.length} site(s) already and the ${ent.label} tier allows ${ent.maxSites}. Deactivate on another site first, or upgrade the plan.`,
        },
        409,
      );
    }

    await db.insert(schema.licenseActivations).values({
      licenseId: row.id,
      siteUrl,
    });
  }

  return c.json({
    ok: true,
    entitlements: {
      ...entitlementsForTier(row.tier as 'free' | 'starter' | 'growth' | 'agency'),
      seats: row.seats,
      renews_at: row.expiresAt ? row.expiresAt.toISOString() : null,
    },
  });
});

/**
 * Lookup a license by Stripe subscription id. Used by the portal's /account
 * page after a successful checkout to display the license key to the
 * customer without requiring them to check their email. This endpoint only
 * returns non-sensitive display fields - it is safe to expose to the
 * browser under CORS, but it still requires the subscription id which is
 * only surfaced to the browser on the post-checkout redirect.
 */
licenseRoutes.get('/by-subscription/:id', async (c) => {
  const subscriptionId = c.req.param('id');
  if (!subscriptionId || !subscriptionId.startsWith('sub_')) {
    return c.json({ ok: false, error: 'Invalid subscription id.' }, 400);
  }

  const rows = await db
    .select()
    .from(schema.licenses)
    .where(eq(schema.licenses.stripeSubscriptionId, subscriptionId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    // Webhooks are eventually-consistent. The portal should poll with
    // backoff for a few seconds after redirect.
    return c.json({ ok: false, error: 'License not yet provisioned. Please refresh in a moment.' }, 404);
  }

  if (!isTier(row.tier)) {
    return c.json({ ok: false, error: 'License tier is invalid; contact support.' }, 500);
  }

  return c.json({
    ok: true,
    license: {
      key: row.key,
      tier: row.tier,
      status: row.status,
      email: row.email,
      expires_at: row.expiresAt ? row.expiresAt.toISOString() : null,
      entitlements: entitlementsForTier(row.tier as 'free' | 'starter' | 'growth' | 'agency'),
    },
  });
});

licenseRoutes.post('/entitlements', zValidator('json', verifySchema), async (c) => {
  const { key } = c.req.valid('json');

  const resolved = await resolveAndValidate(key);
  if (!resolved.ok) {
    return c.json({ ok: false, error: resolved.error }, 400);
  }
  const row = resolved.row;

  return c.json({
    ok: true,
    entitlements: {
      ...entitlementsForTier(row.tier as 'free' | 'starter' | 'growth' | 'agency'),
      seats: row.seats,
      renews_at: row.expiresAt ? row.expiresAt.toISOString() : null,
    },
  });
});
