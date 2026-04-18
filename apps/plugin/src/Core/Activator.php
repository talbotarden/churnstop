<?php
declare(strict_types=1);

namespace ChurnStop\Core;

use ChurnStop\Database\Migrations;

/**
 * Runs on plugin activation. Creates tables and seeds the default flow.
 */
final class Activator
{
    public static function activate(): void
    {
        Migrations::run();

        // Seed default flow on first activation only.
        if (!get_option('churnstop_default_flow_seeded')) {
            self::seedDefaultFlow();
            update_option('churnstop_default_flow_seeded', 1);
        }

        // Flag for welcome redirect on next admin page load.
        set_transient('churnstop_activation_redirect', 1, 30);
    }

    private static function seedDefaultFlow(): void
    {
        global $wpdb;

        $flowsTable = $wpdb->prefix . 'churnstop_flows';
        $stepsTable = $wpdb->prefix . 'churnstop_flow_steps';

        $wpdb->insert($flowsTable, [
            'name' => 'Default Cancellation Flow',
            'trigger_event' => 'wc_subs_cancel_clicked',
            'is_active' => 1,
            'created_at' => current_time('mysql'),
        ]);

        $flowId = (int) $wpdb->insert_id;

        // Step 1: survey.
        $wpdb->insert($stepsTable, [
            'flow_id' => $flowId,
            'step_order' => 1,
            'step_type' => 'survey',
            'config_json' => wp_json_encode([
                'question' => 'What is your main reason for cancelling?',
                'required' => true,
                'options' => [
                    ['id' => 'too_expensive', 'label' => 'Too expensive'],
                    ['id' => 'not_using', 'label' => 'Not using it enough'],
                    ['id' => 'missing_feature', 'label' => 'Missing a feature I need'],
                    ['id' => 'switching', 'label' => 'Switching to a different tool'],
                    ['id' => 'technical', 'label' => 'Technical issues'],
                    ['id' => 'other', 'label' => 'Other'],
                ],
                'open_text_followup' => true,
                'open_text_required' => false,
            ]),
        ]);

        // Step 2: offer.
        $wpdb->insert($stepsTable, [
            'flow_id' => $flowId,
            'step_order' => 2,
            'step_type' => 'offer',
            'config_json' => wp_json_encode([
                'default_offer' => [
                    'type' => 'discount',
                    'value' => 20,
                    'duration_billing_cycles' => 3,
                ],
                'conditional' => [
                    'too_expensive' => ['type' => 'discount', 'value' => 25, 'duration_billing_cycles' => 3],
                    'not_using' => ['type' => 'pause', 'duration_days' => 30],
                    'switching' => ['type' => 'discount', 'value' => 30, 'duration_billing_cycles' => 6],
                    'technical' => ['type' => 'support_route'],
                ],
            ]),
        ]);
    }
}
