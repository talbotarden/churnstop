<?php
/**
 * Plugin Name: ChurnStop - Cancellation Save Flow for WooCommerce Subscriptions (Click-to-Cancel Compliant)
 * Plugin URI: https://churnstop.org
 * Description: Intercept subscription cancellations with a branching flow of targeted save offers. Pause, discount, skip-renewal, tier-down, and more - all click-to-cancel compliant. Built for WooCommerce Subscriptions.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: ChurnStop
 * Author URI: https://churnstop.org
 * Text Domain: churnstop
 * Domain Path: /languages
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * WC requires at least: 8.0
 * WC tested up to: 9.4
 * Requires Plugins: woocommerce, woocommerce-subscriptions
 *
 * @package ChurnStop
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

define('CHURNSTOP_VERSION', '0.1.0');
define('CHURNSTOP_FILE', __FILE__);
define('CHURNSTOP_DIR', plugin_dir_path(__FILE__));
define('CHURNSTOP_URL', plugin_dir_url(__FILE__));
define('CHURNSTOP_BASENAME', plugin_basename(__FILE__));

// Composer autoload
if (file_exists(CHURNSTOP_DIR . 'vendor/autoload.php')) {
    require_once CHURNSTOP_DIR . 'vendor/autoload.php';
} else {
    add_action('admin_notices', static function (): void {
        echo '<div class="notice notice-error"><p><strong>ChurnStop:</strong> Composer dependencies missing. Run <code>composer install</code> in the plugin directory.</p></div>';
    });

    return;
}

// Declare HPOS + Cart/Checkout Blocks compatibility.
add_action('before_woocommerce_init', static function (): void {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', CHURNSTOP_FILE, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', CHURNSTOP_FILE, true);
    }
});

// Boot.
add_action('plugins_loaded', static function (): void {
    if (!class_exists('WC_Subscriptions')) {
        add_action('admin_notices', static function (): void {
            echo '<div class="notice notice-warning"><p><strong>ChurnStop</strong> requires WooCommerce Subscriptions to be active.</p></div>';
        });

        return;
    }

    \ChurnStop\Plugin::instance()->boot();
}, 20);

// Activation.
register_activation_hook(__FILE__, [\ChurnStop\Core\Activator::class, 'activate']);

// Deactivation.
register_deactivation_hook(__FILE__, [\ChurnStop\Core\Deactivator::class, 'deactivate']);
