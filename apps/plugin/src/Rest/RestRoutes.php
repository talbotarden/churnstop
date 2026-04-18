<?php
declare(strict_types=1);

namespace ChurnStop\Rest;

use ChurnStop\Compliance\ClickToCancel;
use ChurnStop\Core\Settings;
use ChurnStop\Flow\FlowEngine;

/**
 * REST API endpoints consumed by the React admin UI.
 * All endpoints require manage_woocommerce capability.
 */
final class RestRoutes
{
    private FlowEngine $flowEngine;

    public function __construct(FlowEngine $flowEngine)
    {
        $this->flowEngine = $flowEngine;
    }

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        register_rest_route('churnstop/v1', '/stats/summary', [
            'methods' => 'GET',
            'callback' => [$this, 'getSummary'],
            'permission_callback' => [$this, 'permissionCheck'],
        ]);

        register_rest_route('churnstop/v1', '/flows', [
            'methods' => 'GET',
            'callback' => [$this, 'listFlows'],
            'permission_callback' => [$this, 'permissionCheck'],
        ]);

        register_rest_route('churnstop/v1', '/events', [
            'methods' => 'GET',
            'callback' => [$this, 'listEvents'],
            'permission_callback' => [$this, 'permissionCheck'],
        ]);

        register_rest_route('churnstop/v1', '/settings', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getSettings'],
                'permission_callback' => [$this, 'permissionCheck'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'updateSettings'],
                'permission_callback' => [$this, 'permissionCheck'],
            ],
        ]);
    }

    public function getSettings(): \WP_REST_Response
    {
        return rest_ensure_response([
            'settings' => Settings::all(),
            'defaults' => Settings::defaults(),
        ]);
    }

    public function updateSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_json_params();

        if (!is_array($payload)) {
            return new \WP_REST_Response(['error' => 'Invalid payload'], 400);
        }

        // Compliance guard: block any settings save that would violate click-to-cancel.
        $compliance = new ClickToCancel();
        $violations = $compliance->validateFlow($payload);

        if (!empty($violations)) {
            return new \WP_REST_Response(['error' => 'Compliance violation', 'violations' => $violations], 422);
        }

        $updated = Settings::update($payload);

        return rest_ensure_response(['settings' => $updated, 'ok' => true]);
    }

    public function permissionCheck(): bool
    {
        return current_user_can('manage_woocommerce');
    }

    public function getSummary(): \WP_REST_Response
    {
        global $wpdb;

        $start = date('Y-m-01 00:00:00');
        $end = date('Y-m-t 23:59:59');

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN final_status = 'saved' THEN 1 ELSE 0 END) AS saved,
                    SUM(CASE WHEN final_status = 'saved' THEN monthly_value_cents ELSE 0 END) AS mrr_preserved_cents
                 FROM {$wpdb->prefix}churnstop_cancellation_events
                 WHERE created_at BETWEEN %s AND %s",
                $start,
                $end
            ),
            ARRAY_A
        );

        return rest_ensure_response([
            'period_start' => $start,
            'period_end' => $end,
            'total_attempts' => (int) ($row['total'] ?? 0),
            'saved' => (int) ($row['saved'] ?? 0),
            'save_rate' => (int) ($row['total'] ?? 0) > 0
                ? round(((int) $row['saved'] / (int) $row['total']) * 100, 1)
                : 0,
            'mrr_preserved_cents' => (int) ($row['mrr_preserved_cents'] ?? 0),
        ]);
    }

    public function listFlows(): \WP_REST_Response
    {
        global $wpdb;

        $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}churnstop_flows ORDER BY id DESC", ARRAY_A);

        return rest_ensure_response($rows ?: []);
    }

    public function listEvents(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;

        $limit = min(100, max(1, (int) $request->get_param('limit') ?: 25));

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}churnstop_cancellation_events ORDER BY created_at DESC LIMIT %d",
                $limit
            ),
            ARRAY_A
        );

        return rest_ensure_response($rows ?: []);
    }
}
