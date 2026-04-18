# packages/

Reserved for Phase 2.

Two workspace packages will land here when the universal JavaScript embed work begins:

- **`packages/modal`** - the cancel-flow React modal, extracted from `apps/plugin/assets/modal/` so it can be consumed by both the WordPress plugin and the universal `flow.js` CDN bundle without duplication.
- **`packages/shared-types`** - TypeScript types shared between `apps/api` (route schemas, adapter interface, entitlements) and `apps/portal` (customer dashboard). Currently the same types are inlined in both `apps/api/src/db/schema.ts` and `apps/portal`; once the shapes stabilise they get hoisted here.

Until then this directory is intentionally empty. See `docs/ADR-001-phased-universal-expansion.md` for the broader phased-expansion rationale and `apps/api/src/adapters/README.md` for how Phase 2 adapters slot in.
