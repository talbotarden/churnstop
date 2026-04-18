<?php
declare(strict_types=1);

namespace ChurnStop\Rest;

use ChurnStop\Compliance\ClickToCancel;
use ChurnStop\Core\Settings;
use ChurnStop\Flow\FlowEngine;
use ChurnStop\License\LicenseManager;

/**
 * REST API endpoints consumed by the React admin UI.
 * All endpoints require manage_woocommerce capability.
 */
final class RestRoutes {

	private FlowEngine $flowEngine;

	private LicenseManager $license;

	public function __construct( FlowEngine $flowEngine, ?LicenseManager $license = null ) {
		$this->flowEngine = $flowEngine;
		$this->license    = $license ?? new LicenseManager();
	}

	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'registerRoutes' ) );
	}

	public function registerRoutes(): void {
		register_rest_route(
			'churnstop/v1',
			'/stats/summary',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'getSummary' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/flows',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'listFlows' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/events',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'listEvents' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/settings',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'getSettings' ),
					'permission_callback' => array( $this, 'permissionCheck' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'updateSettings' ),
					'permission_callback' => array( $this, 'permissionCheck' ),
				),
			)
		);

		// License endpoints. Restricted to manage_options (not manage_woocommerce)
		// because license activation affects billing and should be an admin-level action.
		register_rest_route(
			'churnstop/v1',
			'/license/status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'licenseStatus' ),
				'permission_callback' => array( $this, 'licensePermissionCheck' ),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/license/activate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'licenseActivate' ),
				'permission_callback' => array( $this, 'licensePermissionCheck' ),
				'args'                => array(
					'key' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/license/deactivate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'licenseDeactivate' ),
				'permission_callback' => array( $this, 'licensePermissionCheck' ),
			)
		);
	}

	public function getSettings(): \WP_REST_Response {
		return rest_ensure_response(
			array(
				'settings' => Settings::all(),
				'defaults' => Settings::defaults(),
			)
		);
	}

	public function updateSettings( \WP_REST_Request $request ): \WP_REST_Response {
		$payload = $request->get_json_params();

		if ( ! is_array( $payload ) ) {
			return new \WP_REST_Response( array( 'error' => 'Invalid payload' ), 400 );
		}

		// Compliance guard: block any settings save that would violate click-to-cancel.
		$compliance = new ClickToCancel();
		$violations = $compliance->validateFlow( $payload );

		if ( ! empty( $violations ) ) {
			return new \WP_REST_Response(
				array(
					'error'      => 'Compliance violation',
					'violations' => $violations,
				),
				422
			);
		}

		$updated = Settings::update( $payload );

		return rest_ensure_response(
			array(
				'settings' => $updated,
				'ok'       => true,
			)
		);
	}

	public function permissionCheck(): bool {
		return current_user_can( 'manage_woocommerce' );
	}

	public function getSummary(): \WP_REST_Response {
		global $wpdb;

		$start = gmdate( 'Y-m-01 00:00:00' );
		$end   = gmdate( 'Y-m-t 23:59:59' );

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

		return rest_ensure_response(
			array(
				// PLATFORM_ADAPTER: declare the platform on every summary payload so
				// future multi-platform dashboard code can roll up across stores.
				'platform'            => 'woocommerce',
				'period_start'        => $start,
				'period_end'          => $end,
				'total_attempts'      => (int) ( $row['total'] ?? 0 ),
				'saved'               => (int) ( $row['saved'] ?? 0 ),
				'save_rate'           => (int) ( $row['total'] ?? 0 ) > 0
					? round( ( (int) $row['saved'] / (int) $row['total'] ) * 100, 1 )
					: 0,
				'mrr_preserved_cents' => (int) ( $row['mrr_preserved_cents'] ?? 0 ),
			)
		);
	}

	public function listFlows(): \WP_REST_Response {
		global $wpdb;

		$rows = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}churnstop_flows ORDER BY id DESC", ARRAY_A );

		return rest_ensure_response( $rows ?: array() );
	}

	public function listEvents( \WP_REST_Request $request ): \WP_REST_Response {
		global $wpdb;

		$limit = min( 100, max( 1, (int) $request->get_param( 'limit' ) ?: 25 ) );

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}churnstop_cancellation_events ORDER BY created_at DESC LIMIT %d",
				$limit
			),
			ARRAY_A
		);

		return rest_ensure_response( $rows ?: array() );
	}

	/**
	 * Build the license status payload the admin License screen consumes.
	 * Always returns 200 with an "active" flag; the React screen decides
	 * whether to show activation UI or deactivation UI based on that flag.
	 */
	public function licenseStatus(): \WP_REST_Response {
		$entitlements = (array) get_option( LicenseManager::ENTITLEMENTS_OPTION, array() );
		$active       = $this->license->isActive();

		return rest_ensure_response(
			array(
				'active'    => $active,
				'tier'      => $entitlements['tier'] ?? null,
				'features'  => $entitlements['features'] ?? array(),
				'seats'     => $entitlements['seats'] ?? null,
				'renews_at' => $entitlements['renews_at'] ?? null,
				'site_url'  => home_url(),
			)
		);
	}

	/**
	 * Paste-and-activate license key handler. Delegates to LicenseManager,
	 * which contacts api.churnstop.org, caches entitlements, and schedules
	 * the background refresh event.
	 */
	public function licenseActivate( \WP_REST_Request $request ): \WP_REST_Response {
		$key = (string) $request->get_param( 'key' );

		if ( $key === '' ) {
			return new \WP_REST_Response(
				array(
					'ok'      => false,
					'message' => __( 'License key is required.', 'churnstop' ),
				),
				400
			);
		}

		$result = $this->license->activate( $key );

		if ( empty( $result['ok'] ) ) {
			return new \WP_REST_Response(
				array(
					'ok'      => false,
					'message' => $result['message'] ?? __( 'Activation failed.', 'churnstop' ),
				),
				422
			);
		}

		// Return fresh status so the UI updates without a second round-trip.
		$status = $this->licenseStatus();

		return rest_ensure_response(
			array(
				'ok'     => true,
				'status' => $status->get_data(),
			)
		);
	}

	/**
	 * Clear the license locally. Does not revoke the key on the ChurnStop
	 * backend; customers who want to re-activate on another site can paste
	 * the same key there (subject to the tier's site cap).
	 */
	public function licenseDeactivate(): \WP_REST_Response {
		$this->license->deactivate();
		$status = $this->licenseStatus();

		return rest_ensure_response(
			array(
				'ok'     => true,
				'status' => $status->get_data(),
			)
		);
	}

	public function licensePermissionCheck(): bool {
		return current_user_can( 'manage_options' );
	}
}
