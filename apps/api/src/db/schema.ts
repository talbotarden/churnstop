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
