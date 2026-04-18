# Billing adapters

This directory holds the `BillingAdapter` interface (`types.ts`) and, in Phase 2, one concrete implementation per supported billing platform.

## Status

- **Phase 1 (current)**: interface only. Concrete adapters are intentionally not implemented. ChurnStop ships only a WooCommerce plugin in Phase 1, and that plugin applies offers locally via WooCommerce Subscriptions APIs (`apps/plugin/src/Flow/FlowEngine.php`). The API never executes offers in Phase 1.
- **Phase 2 (planned)**: add `stripe.ts`, `paddle.ts`, `recurly.ts`, `chargebee.ts`, `lemonsqueezy.ts`, plus `woocommerce.ts` that mirrors the PHP `FlowEngine` over HTTP for parity. A registry in `index.ts` maps `platform` strings to adapters. Route handlers under `/flow/*` resolve the adapter at request time and never branch on `platform` themselves.

## Why an interface now if no implementations exist yet

The Phase 1 API contract already accepts a `platform` field on every request. By committing the interface today, future contributors (or future-us) writing a Stripe adapter cannot accidentally invent a different shape, and the route layer has a real type to bind against from day one.

## Conventions

- All methods are async and return `{ ok: boolean; error?: string }`. Never throw for expected failures (rate limits, declined cards, missing subscription); reserve throws for programmer errors.
- Inputs use the abstract `AdapterContext` (`platform`, `externalSubscriptionId`, optional `externalCustomerId` and free-form `metadata`). Never accept platform-specific identifiers in the public method signatures.
- Adapter implementation files own all platform SDK imports. Nothing outside this directory imports `stripe`, `@paddle/sdk`, etc.
- New adapters require: an entry in the registry, integration tests with the platform's official test mode, and a row in the supported-platforms table in the marketing site.

## Out of scope for this directory

- Webhook receipt handling (lives under `apps/api/src/routes/webhooks/`).
- OAuth flows for connecting merchant accounts (lives under `apps/api/src/routes/connect/`).
- Customer object unification across platforms (deferred until Phase 2 customer model lands).

See `docs/ADR-001-phased-universal-expansion.md` for the full architectural reasoning.
