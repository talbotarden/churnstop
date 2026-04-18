# ChurnStop

Cancellation save flow for WooCommerce Subscriptions. Intercepts cancel clicks, shows branching offers based on the cancel reason, reports MRR preserved.

Monorepo managed by Turborepo + pnpm workspaces.

## Structure

```
apps/
  plugin/   WordPress plugin (PHP). The free core lives here.
  api/      Hono / Node SaaS backend (license, benchmarks, winback email).
  portal/   Next.js marketing site + customer portal (Stripe checkout, docs).
packages/
  shared-types/  TypeScript types shared between api and portal.
```

## Getting started

Prerequisites: pnpm >= 9, Node >= 20, PHP >= 7.4, Composer, a local WordPress with WooCommerce + WooCommerce Subscriptions.

```bash
pnpm install
pnpm --filter @churnstop/plugin composer-install
pnpm --filter @churnstop/plugin build
```

Symlink or copy `apps/plugin` into your local WordPress `wp-content/plugins` as `churnstop`.

### Run the SaaS backend locally

```bash
pnpm --filter @churnstop/api dev
```

Expects `DATABASE_URL` pointing at a local or Neon Postgres. See `apps/api/.env.example`.

### Run the portal locally

```bash
pnpm --filter @churnstop/portal dev
```

## Phase 1 goal

Ship the free core plugin to wordpress.org. See `NEXT-STEPS.md` for the first-week coding checklist.

## License

GPL-2.0-or-later for the plugin (wordpress.org requirement).
Apache-2.0 for the api + portal.
