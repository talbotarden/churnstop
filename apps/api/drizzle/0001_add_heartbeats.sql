CREATE TABLE IF NOT EXISTS "license_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid NOT NULL,
	"site_url" text NOT NULL,
	"platform" text DEFAULT 'woocommerce' NOT NULL,
	"month" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"saved" integer DEFAULT 0 NOT NULL,
	"mrr_preserved_cents" integer DEFAULT 0 NOT NULL,
	"plugin_version" text,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hb_license_month" ON "license_heartbeats" USING btree ("license_id","month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hb_unique" ON "license_heartbeats" USING btree ("license_id","site_url","month");