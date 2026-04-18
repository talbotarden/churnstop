# ADR-001: Phased universal expansion

**Status**: accepted
**Date**: 2026-04-18

## Context

ChurnStop launches as a WooCommerce Subscriptions plugin (Phase 1). The medium-term plan is to add a universal JavaScript embed plus billing adapters for Stripe, Paddle, Recurly, Chargebee, and Lemon Squeezy (Phase 2). We do not want Phase 2 to require a refactor of any code shipped in Phase 1. Adding a platform should be a pure addition: new files, no existing files mutated outside a small set of registries and the marketing site.

## Decision

Phase 1 code is written against a platform-agnostic API contract and a billing-adapter extension seam, even though only one platform (`woocommerce`) is supported and no concrete adapters exist yet. The discipline below applies to all new code.

### Principles

1. **Platform-agnostic API contract.** `apps/api` never assumes the caller is WordPress. Every endpoint accepts an abstract subscription payload that always carries `platform`, `external_subscription_id` (string), `external_customer_id`, `customer_email`, `monthly_value_cents`, `currency`, and free-form `metadata`. No WP primitives (post IDs, usermeta, options) appear in any request or response.

2. **Platform-qualified identifiers in storage.** Records that may be written by multiple platforms in Phase 2 carry `(platform, external_subscription_id)` with a composite index. WP-internal tables keep their integer `subscription_id` for performance and join compatibility, but also carry the abstract pair populated at insert time.

3. **Billing adapters are the extension point.** Offer execution (discount, pause, skip renewal, cancel) is routed through a `BillingAdapter` interface. Phase 1 ships the interface (`apps/api/src/adapters/types.ts`) with no concrete implementations; the WordPress plugin applies offers locally via `FlowEngine`. Phase 2 adds one adapter file per platform plus a registry. Route handlers never branch on `platform`; they look up the adapter.

4. **Modal stays portable.** The React modal (`apps/plugin/assets/modal/`) takes typed props from a single bootstrap shim. It does not import WordPress globals, `wp.apiFetch`, or anything outside React. It speaks to a generic `/flow/start`, `/flow/submit-survey`, `/flow/accept-offer`, `/flow/decline-and-cancel` HTTP surface that can be served by `wp-admin/admin-ajax.php` (Phase 1) or `api.churnstop.org` (Phase 2). Phase 2 extracts it to `packages/modal` for the universal embed.

5. **API contract is the source of truth.** Every new endpoint added during Phase 1 follows the abstract contract. The fact that only WordPress calls it today is irrelevant to the design.

6. **Flow and offer definitions are portable.** Flows and steps are stored in custom tables (not post meta) using the same JSON shape Phase 2 will use. Offers reference abstract type + value pairs (`{ type: "discount", value_percent: 20, duration_billing_cycles: 3 }`), not platform-specific concepts (no `wc_coupon_code` in flow JSON). Coupon creation, pause mechanics, and renewal shifts are adapter-level concerns.

## Consequences

- Phase 1 carries a small upfront cost: a `platform` field on every payload, a few `// PLATFORM_ADAPTER:` comments, an empty adapters directory, an extra column and index on `churnstop_cancellation_events`, and one ADR.
- Phase 2 work is additive: write a new adapter, register it, ship a new marketing page row. No breaking changes to plugin users, no migration of existing data.
- A future contributor can read this document plus the adapters README and ship a Stripe adapter without touching anything outside `apps/api/src/adapters/`, `apps/portal/app/`, and `apps/plugin/readme.txt`.

## Out of scope

OAuth flows for connecting merchant accounts, customer object unification across platforms, webhook receipt handlers, and the universal JavaScript embed itself are deferred to Phase 2 by design. Including them now would exceed the launch scope and tie down decisions that are better made once the first adapter is being written.
