<?php
/**
 * Uninstall handler. Drops tables and options only when the user explicitly
 * deletes the plugin (not on deactivation).
 */
declare(strict_types=1);

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

$tables = [
    $wpdb->prefix . 'churnstop_flows',
    $wpdb->prefix . 'churnstop_flow_steps',
    $wpdb->prefix . 'churnstop_cancellation_events',
    $wpdb->prefix . 'churnstop_offers_issued',
    $wpdb->prefix . 'churnstop_ab_tests',
    $wpdb->prefix . 'churnstop_ab_assignments',
];

foreach ($tables as $table) {
    $wpdb->query("DROP TABLE IF EXISTS `$table`");
}

$options = [
    'churnstop_db_version',
    'churnstop_license_key',
    'churnstop_entitlements',
    'churnstop_default_flow_seeded',
    'churnstop_settings',
];

foreach ($options as $option) {
    delete_option($option);
}

wp_clear_scheduled_hook('churnstop_license_refresh');
wp_clear_scheduled_hook('churnstop_winback_tick');
