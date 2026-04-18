import { pgTable, serial, text, timestamp, integer, boolean, uuid, jsonb, index } from 'drizzle-orm/pg-core';

export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  email: text('email').notNull(),
  tier: text('tier').notNull(),
  status: text('status').notNull().default('active'),
  seats: integer('seats').notNull().default(1),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export const licenseActivations = pgTable('license_activations', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').notNull(),
  siteUrl: text('site_url').notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bySite: index('idx_site_url').on(t.siteUrl),
  byLicense: index('idx_license_id').on(t.licenseId),
}));

export const benchmarkIngest = pgTable('benchmark_ingest', {
  id: serial('id').primaryKey(),
  licenseId: uuid('license_id'),
  month: text('month').notNull(), // YYYY-MM
  saveRate: integer('save_rate_bp').notNull(), // basis points; 2850 = 28.50%
  attempts: integer('attempts').notNull(),
  mrrPreservedCents: integer('mrr_preserved_cents').notNull(),
  industryTag: text('industry_tag'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Multi-site heartbeats. Each plugin install pushes a monthly rollup of
 * save-flow metrics. Keyed on (license_id, site_url, month) so a site
 * can safely resend the same month and just overwrite the latest values.
 */
export const licenseHeartbeats = pgTable(
  'license_heartbeats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    licenseId: uuid('license_id').notNull(),
    siteUrl: text('site_url').notNull(),
    platform: text('platform').notNull().default('woocommerce'),
    month: text('month').notNull(), // YYYY-MM
    attempts: integer('attempts').notNull().default(0),
    saved: integer('saved').notNull().default(0),
    mrrPreservedCents: integer('mrr_preserved_cents').notNull().default(0),
    pluginVersion: text('plugin_version'),
    reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byLicenseMonth: index('idx_hb_license_month').on(t.licenseId, t.month),
    uniq: index('idx_hb_unique').on(t.licenseId, t.siteUrl, t.month),
  }),
);

export const winbackJobs = pgTable('winback_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('queued'),
  sendAt: timestamp('send_at', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  errorMsg: text('error_msg'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
