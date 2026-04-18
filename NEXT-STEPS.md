# ChurnStop - Next Steps

This scaffold gives you a working skeleton. Here's the recommended order for the first two weeks.

## Day 1 - get it running locally

1. Create a new private GitHub repo named `churnstop` and push this tree.
2. Install dependencies:
   ```bash
   pnpm install
   cd apps/plugin && composer install
   ```
3. Symlink or copy `apps/plugin` into your local WordPress `wp-content/plugins` as `churnstop`:
   ```bash
   ln -s /absolute/path/to/churnstop/apps/plugin /absolute/path/to/wp-content/plugins/churnstop
   ```
4. Activate ChurnStop in your local WordPress. WooCommerce and WooCommerce Subscriptions must be active first.
5. Build the React bundles once: `cd apps/plugin && pnpm run build`
6. Go to WP admin > ChurnStop. You should see the Dashboard with zeros.
7. Create a test subscription in WooCommerce, then visit the My Account page and click cancel. The modal should appear.

## Days 2-3 - polish the free core

The scaffold ships a working flow but the modal styling is minimal. Spend time on:

- CSS for the modal (`apps/plugin/assets/modal/src/`). Match the customer's theme; don't look like a spam popup.
- Admin Settings screen (currently a placeholder). Let merchants pick their offer amount, pause duration, and cancel-reason options.
- Error handling throughout. Every AJAX failure should show a helpful message with a "cancel anyway" escape.
- Unit tests for `FlowEngine::acceptOffer` and `ClickToCancel::validateFlow`.

## Days 4-5 - wordpress.org submission

1. Run `composer run lint` and `composer run analyse` and fix every warning.
2. Build a release zip: `cd apps/plugin && pnpm run build && zip -r ../../churnstop.zip . -x "node_modules/*" "tests/*" "vendor/*" "*.git*"`
3. Submit to https://wordpress.org/plugins/developers/add using your author account.
4. Review is 1-14 days. Expect feedback; address and resubmit.

## Week 2 - stand up the backend

Only needed when you're ready to start selling the paid tier.

1. Provision a Neon Postgres database. Copy the connection string to `apps/api/.env`.
2. Generate initial migrations: `cd apps/api && pnpm run db:generate && pnpm run db:migrate`
3. Deploy the API: `fly launch` in `apps/api`, or Render, or Railway.
4. Point `api.churnstop.org` DNS at the deployment.
5. Deploy the portal: `vercel link && vercel` in `apps/portal`, then set `churnstop.org` and `app.churnstop.org` in Vercel project settings.
6. Add Stripe: create products for Starter / Growth / Agency tiers. Wire checkout in the portal.

## Week 3+ - phase 2 paid features

Start implementing the branching flow UI, A/B testing engine, and save-rate dashboard in the admin. Every paid feature should be gated by `LicenseManager::has('feature_key')`.

## What's NOT in this scaffold yet

You'll want to add these before going live:

- Actual CSS for the cancel modal (starter styles only)
- Settings screen implementation (currently just a placeholder)
- Flow builder UI in admin (phase 2)
- Stripe checkout flow in the portal
- Email templates for winback sequences
- Screenshots + banners for wp.org listing (1544x500 banner, 256x256 icon, 6-8 screenshots)
- Translations (translate.wordpress.org submission once plugin is listed)
- PHPUnit test files (empty directory in scaffold)
- Sentry integration in the API
- Rate limiting on license endpoints

## wordpress.org listing submission checklist

Before submitting:

- [ ] Plugin activates cleanly on a fresh WP 6.9 install with WC 9.4 and WC Subs
- [ ] No PHP warnings with WP_DEBUG = true
- [ ] phpcs and phpstan pass
- [ ] readme.txt validates: https://wordpress.org/plugins/developers/readme-validator/
- [ ] Short description is under 150 chars
- [ ] Five tags are set and each is a keyword people actually search
- [ ] Tested up to matches the latest WP version
- [ ] License is GPL-2.0-or-later
- [ ] No bundled third-party libraries without proper credit
- [ ] Uninstall correctly drops tables and options
- [ ] No external HTTP calls in the free code path
- [ ] Banner 1544x500 and icon 256x256 ready for assets/ SVN folder

## Open decisions

- [ ] GitHub org name for the repo URL (placeholder in CI config)
- [ ] Domain registrar for churnstop.org (if not already set up)
- [ ] Author display name for wp.org listing
- [ ] Stripe account setup (test vs live keys in env)
- [ ] Sentry account for error tracking
- [ ] Postmark or SES for transactional email
