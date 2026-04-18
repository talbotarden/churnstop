<?php
declare(strict_types=1);

namespace ChurnStop\MultiSite;

use ChurnStop\License\LicenseManager;

/**
 * Pushes a monthly heartbeat (attempts + saves + MRR preserved for the
 * current calendar month) to api.churnstop.org for agency rollups and
 * anonymised cross-store benchmarks.
 *
 * Runs once per day via WP-cron; the server-side endpoint upserts on
 * (license_id, site_url, month) so running daily is idempotent.
 *
 * Sends on every tier (not just Agency) because even free-tier data
 * feeds the anonymised industry benchmarks - but the Agency rollup view
 * only surfaces sites where the posted license key belongs to the
 * caller.
 */
final class MultiSiteReporter {

	public const CRON_HOOK = 'churnstop_multisite_heartbeat';

	private const CRON_RECURRENCE = 'daily';

	private const API_BASE = 'https://api.churnstop.org';

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function register(): void {
		add_action( self::CRON_HOOK, array( $this, 'tick' ) );
		add_action( 'init', array( $this, 'maybeSchedule' ) );
	}

	public function maybeSchedule(): void {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, self::CRON_RECURRENCE, self::CRON_HOOK );
		}
	}

	public function tick(): void {
		if ( ! $this->license->isActive() ) {
			return;
		}

		$month = gmdate( 'Y-m' );

		global $wpdb;
		$table = $wpdb->prefix . 'churnstop_cancellation_events';

		$start = $month . '-01 00:00:00';
		$end   = gmdate( 'Y-m-t 23:59:59', strtotime( $start ) ?: time() );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT COUNT(*) AS attempts,
				        SUM(CASE WHEN final_status = 'saved' THEN 1 ELSE 0 END) AS saved,
				        SUM(CASE WHEN final_status = 'saved' THEN monthly_value_cents ELSE 0 END) AS mrr_preserved_cents
				   FROM {$table}
				  WHERE created_at BETWEEN %s AND %s",
				$start,
				$end
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$payload = array(
			'platform'            => 'woocommerce',
			'key'                 => (string) get_option( LicenseManager::LICENSE_KEY_OPTION, '' ),
			'site_url'            => home_url(),
			'month'               => $month,
			'attempts'            => (int) ( $row['attempts'] ?? 0 ),
			'saved'               => (int) ( $row['saved'] ?? 0 ),
			'mrr_preserved_cents' => (int) ( $row['mrr_preserved_cents'] ?? 0 ),
			'plugin_version'      => defined( 'CHURNSTOP_VERSION' ) ? (string) CHURNSTOP_VERSION : '',
		);

		if ( $payload['key'] === '' ) {
			return;
		}

		wp_remote_post(
			self::API_BASE . '/license/heartbeat',
			array(
				'timeout'  => 10,
				'blocking' => false, // fire-and-forget
				'headers'  => array( 'Content-Type' => 'application/json' ),
				'body'     => wp_json_encode( $payload ),
			)
		);
	}
}
