<?php
declare(strict_types=1);

namespace ChurnStop\Rest;

use ChurnStop\Analytics\CohortLtv;
use ChurnStop\Branding\WhiteLabel;
use ChurnStop\Compliance\ClickToCancel;
use ChurnStop\Core\Settings;
use ChurnStop\Experiments\AbTestManager;
use ChurnStop\Flow\FlowEngine;
use ChurnStop\License\LicenseManager;
use ChurnStop\Winback\WinbackScheduler;
use ChurnStop\Winback\WinbackSequence;

/**
 * REST API endpoints consumed by the React admin UI.
 * All endpoints require manage_woocommerce capability.
 */
final class RestRoutes {

	private FlowEngine $flowEngine;

	private LicenseManager $license;

	private AbTestManager $abTest;

	private CohortLtv $cohortLtv;

	private WhiteLabel $whiteLabel;

	public function __construct( FlowEngine $flowEngine, ?LicenseManager $license = null, ?AbTestManager $abTest = null, ?CohortLtv $cohortLtv = null, ?WhiteLabel $whiteLabel = null ) {
		$this->flowEngine = $flowEngine;
		$this->license    = $license ?? new LicenseManager();
		$this->abTest     = $abTest ?? new AbTestManager( $this->license );
		$this->cohortLtv  = $cohortLtv ?? new CohortLtv( $this->license );
		$this->whiteLabel = $whiteLabel ?? new WhiteLabel( $this->license );
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

		register_rest_route(
			'churnstop/v1',
			'/ab-tests',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'listAbTests' ),
					'permission_callback' => array( $this, 'permissionCheck' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'createAbTest' ),
					'permission_callback' => array( $this, 'permissionCheck' ),
				),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/ab-tests/(?P<id>\d+)/results',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'abTestResults' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/branding',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'getBranding' ),
					'permission_callback' => array( $this, 'permissionCheck' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'updateBranding' ),
					'permission_callback' => array( $this, 'permissionCheck' ),
				),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/winback/sequence',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'winbackSequence' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/winback/queue',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'winbackQueue' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/analytics/cohort-ltv',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'cohortLtv' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
				'args'                => array(
					'fresh' => array(
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
				),
			)
		);

		register_rest_route(
			'churnstop/v1',
			'/ab-tests/(?P<id>\d+)/stop',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'stopAbTest' ),
				'permission_callback' => array( $this, 'permissionCheck' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	public function listAbTests(): \WP_REST_Response {
		if ( ! $this->abTest->isEnabled() ) {
			return new \WP_REST_Response(
				array(
					'error'    => 'ab_testing_not_licensed',
					'message'  => __( 'A/B testing requires a Starter plan or higher.', 'churnstop' ),
					'feature'  => AbTestManager::FEATURE,
				),
				402
			);
		}

		return rest_ensure_response(
			array(
				'tests' => $this->abTest->listTests(),
			)
		);
	}

	public function createAbTest( \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! $this->abTest->isEnabled() ) {
			return new \WP_REST_Response(
				array(
					'error'   => 'ab_testing_not_licensed',
					'message' => __( 'A/B testing requires a Starter plan or higher.', 'churnstop' ),
				),
				402
			);
		}

		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new \WP_REST_Response( array( 'error' => 'Invalid payload' ), 400 );
		}

		$name     = isset( $payload['name'] ) ? sanitize_text_field( (string) $payload['name'] ) : '';
		$flowId   = isset( $payload['flow_id'] ) ? (int) $payload['flow_id'] : 0;
		$variants = isset( $payload['variants'] ) && is_array( $payload['variants'] ) ? $payload['variants'] : array();

		if ( $name === '' || $flowId <= 0 || count( $variants ) < 2 ) {
			return new \WP_REST_Response(
				array( 'error' => 'Name, flow_id, and at least 2 variants are required.' ),
				422
			);
		}

		$cleaned = array();
		foreach ( $variants as $variant ) {
			if ( ! is_array( $variant ) || empty( $variant['name'] ) ) {
				continue;
			}
			$cleaned[] = array(
				'name'   => sanitize_text_field( (string) $variant['name'] ),
				'weight' => max( 1, (int) ( $variant['weight'] ?? 1 ) ),
				'config' => is_array( $variant['config'] ?? null ) ? $variant['config'] : array(),
			);
		}

		if ( count( $cleaned ) < 2 ) {
			return new \WP_REST_Response(
				array( 'error' => 'Each variant needs a name.' ),
				422
			);
		}

		$id = $this->abTest->createTest( $name, $flowId, $cleaned );

		if ( $id === 0 ) {
			return new \WP_REST_Response( array( 'error' => 'Could not create test.' ), 500 );
		}

		return rest_ensure_response(
			array(
				'ok' => true,
				'id' => $id,
			)
		);
	}

	public function abTestResults( \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! $this->abTest->isEnabled() ) {
			return new \WP_REST_Response(
				array( 'error' => 'ab_testing_not_licensed' ),
				402
			);
		}

		$id = (int) $request->get_param( 'id' );
		$tests = $this->abTest->listTests();
		$test = null;
		foreach ( $tests as $row ) {
			if ( (int) $row['id'] === $id ) {
				$test = $row;
				break;
			}
		}

		if ( ! $test ) {
			return new \WP_REST_Response( array( 'error' => 'Test not found.' ), 404 );
		}

		return rest_ensure_response(
			array(
				'test'    => $test,
				'results' => $this->abTest->computeResults( $test ),
			)
		);
	}

	public function stopAbTest( \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! $this->abTest->isEnabled() ) {
			return new \WP_REST_Response( array( 'error' => 'ab_testing_not_licensed' ), 402 );
		}

		$this->abTest->stopTest( (int) $request->get_param( 'id' ) );

		return rest_ensure_response( array( 'ok' => true ) );
	}

	public function getBranding(): \WP_REST_Response {
		return rest_ensure_response(
			array(
				'enabled'  => $this->whiteLabel->isEnabled(),
				'branding' => $this->whiteLabel->branding(),
			)
		);
	}

	public function updateBranding( \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! $this->whiteLabel->isEnabled() ) {
			return new \WP_REST_Response(
				array(
					'error'   => 'white_label_not_licensed',
					'message' => __( 'White-label branding requires an Agency plan.', 'churnstop' ),
				),
				402
			);
		}

		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new \WP_REST_Response( array( 'error' => 'Invalid payload' ), 400 );
		}

		$saved = $this->whiteLabel->save( $payload );

		return rest_ensure_response(
			array(
				'ok'       => true,
				'branding' => $saved,
			)
		);
	}

	public function winbackSequence(): \WP_REST_Response {
		if ( ! $this->license->has( WinbackScheduler::FEATURE ) ) {
			return new \WP_REST_Response(
				array(
					'error'   => 'winback_not_licensed',
					'message' => __( 'Winback automation requires a Growth plan or higher.', 'churnstop' ),
				),
				402
			);
		}

		return rest_ensure_response(
			array(
				'sequence' => WinbackSequence::steps(),
			)
		);
	}

	public function winbackQueue(): \WP_REST_Response {
		if ( ! $this->license->has( WinbackScheduler::FEATURE ) ) {
			return new \WP_REST_Response(
				array( 'error' => 'winback_not_licensed' ),
				402
			);
		}

		global $wpdb;
		$table = $wpdb->prefix . WinbackScheduler::TABLE_QUEUE;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			"SELECT id, cancellation_event_id, recipient_email, step_number, subject, status, send_at, sent_at, error_msg
			 FROM {$table}
			 ORDER BY send_at DESC
			 LIMIT 100",
			ARRAY_A
		) ?: array();

		$counts = $wpdb->get_results(
			"SELECT status, COUNT(*) AS n FROM {$table} GROUP BY status",
			ARRAY_A
		) ?: array();
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$summary = array();
		foreach ( $counts as $row ) {
			$summary[ (string) $row['status'] ] = (int) $row['n'];
		}

		return rest_ensure_response(
			array(
				'queue'   => $rows,
				'summary' => $summary,
			)
		);
	}

	public function cohortLtv( \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! $this->cohortLtv->isEnabled() ) {
			return new \WP_REST_Response(
				array(
					'error'   => 'cohort_ltv_not_licensed',
					'message' => __( 'Cohort LTV analytics requires a Growth plan or higher.', 'churnstop' ),
				),
				402
			);
		}

		$fresh = (bool) $request->get_param( 'fresh' );
		if ( $fresh ) {
			$this->cohortLtv->invalidateCache();
		}

		return rest_ensure_response( $this->cohortLtv->compute( ! $fresh ) );
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
