<?php
declare(strict_types=1);

namespace ChurnStop\Database;

/**
 * Creates and migrates ChurnStop custom tables.
 *
 * Custom tables (not post meta) are used for event and analytics data to keep
 * performance acceptable at 10k+ cancellation events per store.
 */
final class Migrations
{
    private const DB_VERSION_OPTION = 'churnstop_db_version';

    private const CURRENT_VERSION = '1';

    public static function run(): void
    {
        global $wpdb;

        $installed = (string) get_option(self::DB_VERSION_OPTION, '0');

        if (version_compare($installed, self::CURRENT_VERSION, '>=')) {
            return;
        }

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset = $wpdb->get_charset_collate();
        $prefix = $wpdb->prefix;

        $statements = [];

        $statements[] = "CREATE TABLE {$prefix}churnstop_flows (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            trigger_event VARCHAR(64) NOT NULL DEFAULT 'wc_subs_cancel_clicked',
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY is_active (is_active)
        ) $charset;";

        $statements[] = "CREATE TABLE {$prefix}churnstop_flow_steps (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            flow_id BIGINT UNSIGNED NOT NULL,
            step_order INT UNSIGNED NOT NULL DEFAULT 0,
            step_type VARCHAR(32) NOT NULL,
            config_json LONGTEXT NOT NULL,
            PRIMARY KEY (id),
            KEY flow_id (flow_id),
            KEY step_order (flow_id, step_order)
        ) $charset;";

        $statements[] = "CREATE TABLE {$prefix}churnstop_cancellation_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            subscription_id BIGINT UNSIGNED NOT NULL,
            flow_id BIGINT UNSIGNED NOT NULL,
            cancel_reason VARCHAR(64) DEFAULT NULL,
            survey_response_json LONGTEXT,
            offer_shown VARCHAR(32) DEFAULT NULL,
            offer_accepted TINYINT(1) NOT NULL DEFAULT 0,
            final_status VARCHAR(16) NOT NULL DEFAULT 'pending',
            monthly_value_cents BIGINT UNSIGNED DEFAULT 0,
            created_at DATETIME NOT NULL,
            resolved_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY subscription_id (subscription_id),
            KEY final_status (final_status),
            KEY created_at (created_at)
        ) $charset;";

        $statements[] = "CREATE TABLE {$prefix}churnstop_offers_issued (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            cancellation_event_id BIGINT UNSIGNED NOT NULL,
            offer_type VARCHAR(32) NOT NULL,
            offer_value VARCHAR(64) DEFAULT NULL,
            expires_at DATETIME DEFAULT NULL,
            redeemed_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            KEY cancellation_event_id (cancellation_event_id)
        ) $charset;";

        $statements[] = "CREATE TABLE {$prefix}churnstop_ab_tests (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            flow_id BIGINT UNSIGNED NOT NULL,
            variants_json LONGTEXT NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'running',
            started_at DATETIME NOT NULL,
            ended_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            KEY status (status)
        ) $charset;";

        $statements[] = "CREATE TABLE {$prefix}churnstop_ab_assignments (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            test_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            variant VARCHAR(64) NOT NULL,
            cancellation_event_id BIGINT UNSIGNED DEFAULT NULL,
            outcome VARCHAR(16) DEFAULT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY test_id (test_id),
            KEY user_test (user_id, test_id)
        ) $charset;";

        foreach ($statements as $sql) {
            dbDelta($sql);
        }

        update_option(self::DB_VERSION_OPTION, self::CURRENT_VERSION);
    }
}
