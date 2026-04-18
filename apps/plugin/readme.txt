=== ChurnStop - Cancellation Save Flow for WooCommerce Subscriptions (Click-to-Cancel Compliant) ===
Contributors: churnstop
Tags: woocommerce subscriptions, cancellation, churn, retention, save offer
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Intercept WooCommerce Subscriptions cancellations with targeted save offers. Pause, discount, skip renewal. Click-to-cancel compliant. Reduce churn.

== Description ==

Stop losing subscribers the moment they click "cancel." ChurnStop intercepts WooCommerce Subscriptions cancellation clicks with a branching save flow that offers targeted incentives based on the cancel reason - pause, discount, skip the next renewal, downgrade, and more. Every offer is one click to accept, and cancelation is always one click to complete. Full ROSCA / FTC click-to-cancel compliance is baked in.

**Who this is for**

* **Subscription merchants** losing customers to voluntary churn who want to offer retention alternatives without custom development.
* **Agencies** managing WooCommerce Subscriptions stores for clients who need a proven save-flow layer.
* **SaaS-style WooCommerce stores** selling memberships, subscription boxes, or recurring services.

**Why ChurnStop**

* **Measurable MRR preserved.** The dashboard shows exactly how much monthly recurring revenue your save flow rescued this month.
* **Click-to-cancel compliant.** "No thanks, cancel my subscription" is always visible and always one click. Built to meet ROSCA requirements.
* **Conditional save offers.** The offer shown is based on the cancel reason the customer selects - discount for price-sensitive customers, pause for "too busy" customers, tier-down for "too expensive" customers.
* **Zero lock-in.** Core save flow runs entirely on your WordPress site. No required SaaS account for the free version.
* **Built for WooCommerce Subscriptions.** Uses native WC Subs APIs for coupons, pauses, and renewal-date shifts. Nothing is hacked together.

== Installation ==

1. Upload the `churnstop` folder to `/wp-content/plugins/`.
2. Activate ChurnStop from the Plugins menu.
3. Visit **ChurnStop** in your WordPress admin to configure the cancellation flow.
4. The default flow ships with a three-step survey + two offer types (discount and pause). Customize as needed.

**Requirements:** WooCommerce 8.0+, WooCommerce Subscriptions active.

== Frequently Asked Questions ==

= Does this work with WooCommerce Subscriptions? =

Yes. ChurnStop hooks into WooCommerce Subscriptions' native cancellation flow and uses its native APIs for pauses, coupon application, and renewal-date changes.

= Is this click-to-cancel compliant? =

Yes. The "No thanks, cancel my subscription" button is always visible on every modal screen and is always one click away from completing the cancellation. The plugin will not let merchants hide or disable it.

= Can I customize the save offers? =

Yes. The free version includes discount and pause offers. Premium tiers unlock skip-renewal, tier-down, extend-trial, and product-swap offer types.

= Does this replace WooCommerce Subscriptions' built-in cancellation? =

No, it layers on top. If ChurnStop is deactivated, the native WC Subs cancellation flow works as before.

= Is my data sent to a third-party? =

No. The free core runs entirely on your WordPress site. If you activate a paid license, the plugin contacts churnstop.org only to verify entitlements.

== Changelog ==

= 0.1.0 =
* Initial release.
* Core cancellation flow interception on WooCommerce Subscriptions.
* Exit survey with configurable cancel reasons.
* Two offer types: percentage discount and pause.
* Click-to-cancel compliance enforcement.
* Admin dashboard with save count.
* GDPR data export/deletion hooks.

== External services ==

**ChurnStop license server** (only if you activate a paid license)

* **What it is:** The ChurnStop activation server that verifies license keys for paid features. The free version never contacts it.
* **When it is called:** Once when you paste a license key, then every 12 hours in the background to refresh cached entitlements.
* **What data is sent:** Your license key and this site's domain (`home_url()`). No subscriber data, no form submissions, no customer records.
* **Where data goes:** `https://api.churnstop.org/license/verify` and `https://api.churnstop.org/license/entitlements`, over HTTPS.
* **Terms of Service:** https://churnstop.org/terms
* **Privacy Policy:** https://churnstop.org/privacy

No other external services are contacted by this plugin.
