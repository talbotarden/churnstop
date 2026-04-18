<?php
declare(strict_types=1);

namespace ChurnStop\Analytics;

use ChurnStop\License\LicenseManager;

/**
 * Cohort LTV computation.
 *
 * A "cohort" is the set of subscriptions whose first billing month is the
 * same calendar month. For each cohort we track, for each month N since
 * inception, how many cohort members were still active, and the cumulative
 * revenue per cohort member. The resulting matrix drives the retention +
 * LTV curves on the Analytics admin screen.
 *
 * Source of truth: the WooCommerce orders + subscriptions tables. We look
 * at each subscription's start_date (cohort month) and build a per-cohort
 * tally from `_paid_date` on the associated orders.
 *
 * Performance: on shops with 10k+ subscriptions this query runs against
 * indexed columns (post_type, post_date) and aggregates in-memory. We
 * cache the result in a transient for 1 hour - merchants rarely need
 * minute-by-minute freshness on a cohort report.
 *
 * License-gated: requires the `cohort_ltv` entitlement (Growth+).
 */
final class CohortLtv {

	public const FEATURE = 'cohort_ltv';

	private const CACHE_KEY     = 'churnstop_cohort_ltv';
	private const CACHE_SECONDS = HOUR_IN_SECONDS;

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function isEnabled(): bool {
		return $this->license->has( self::FEATURE );
	}

	/**
	 * Compute (or read from cache) the cohort matrix. Returns a payload with
	 * one cohort per month plus per-month retention + cumulative-revenue
	 * vectors covering the last 12 months of inception.
	 *
	 * @return array{
	 *   cohorts: array<int, array{
	 *     cohort: string,
	 *     size: int,
	 *     months: array<int, array{month: int, retained: int, retention: float, cumulative_revenue_cents: int}>,
	 *     ltv_cents: int,
	 *   }>,
	 *   generated_at: string,
	 *   cached: bool,
	 * }
	 */
	public function compute( bool $useCache = true ): array {
		if ( $useCache ) {
			$cached = get_transient( self::CACHE_KEY );
			if ( is_array( $cached ) ) {
				$cached['cached'] = true;
				return $cached;
			}
		}

		$cohorts = $this->buildCohortMatrix();

		$payload = array(
			'cohorts'      => $cohorts,
			'generated_at' => gmdate( 'c' ),
			'cached'       => false,
		);

		set_transient( self::CACHE_KEY, $payload, self::CACHE_SECONDS );

		return $payload;
	}

	public function invalidateCache(): void {
		delete_transient( self::CACHE_KEY );
	}

	/**
	 * Aggregate orders by (cohort_month, months_since_cohort). We define
	 * "cohort_month" as the YYYY-MM of the subscription's start_date and
	 * "months_since_cohort" as the number of whole calendar months between
	 * cohort_month and the order's payment date.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function buildCohortMatrix(): array {
		global $wpdb;

		$cutoff = gmdate( 'Y-m-01 00:00:00', strtotime( '-12 months' ) );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$subRows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT p.ID AS subscription_id,
				        DATE_FORMAT(p.post_date_gmt, '%%Y-%%m') AS cohort,
				        p.post_status AS status
				   FROM {$wpdb->posts} p
				  WHERE p.post_type = 'shop_subscription'
				    AND p.post_date_gmt >= %s
				  ORDER BY p.post_date_gmt ASC",
				$cutoff
			),
			ARRAY_A
		) ?: array();

		if ( ! $subRows ) {
			return array();
		}

		$subscriptionIds = array_map( static fn( $r ) => (int) $r['subscription_id'], $subRows );
		$cohortBySub     = array();
		foreach ( $subRows as $row ) {
			$cohortBySub[ (int) $row['subscription_id'] ] = (string) $row['cohort'];
		}

		// Pull all renewal + parent orders tied to those subscriptions.
		$idsFragment = implode( ',', array_map( 'intval', $subscriptionIds ) );

		$orderRows = $wpdb->get_results(
			"SELECT o.ID AS order_id,
			        o.post_date_gmt AS paid_at,
			        rm.meta_value AS subscription_id_meta,
			        CAST(tm.meta_value AS DECIMAL(18,2)) AS order_total
			   FROM {$wpdb->posts} o
			   INNER JOIN {$wpdb->postmeta} rm ON rm.post_id = o.ID AND rm.meta_key = '_subscription_renewal'
			   LEFT JOIN {$wpdb->postmeta} tm ON tm.post_id = o.ID AND tm.meta_key = '_order_total'
			  WHERE o.post_type = 'shop_order'
			    AND o.post_status IN ('wc-completed','wc-processing')
			    AND rm.meta_value IN ({$idsFragment})",
			ARRAY_A
		) ?: array();

		// Include the initial payment by pulling the parent subscription row's total.
		$initialRows = $wpdb->get_results(
			"SELECT p.ID AS subscription_id,
			        p.post_date_gmt AS paid_at,
			        CAST(tm.meta_value AS DECIMAL(18,2)) AS order_total
			   FROM {$wpdb->posts} p
			   LEFT JOIN {$wpdb->postmeta} tm ON tm.post_id = p.ID AND tm.meta_key = '_order_total'
			  WHERE p.post_type = 'shop_subscription'
			    AND p.ID IN ({$idsFragment})",
			ARRAY_A
		) ?: array();
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$matrix = array();
		foreach ( array_merge( $orderRows, $initialRows ) as $row ) {
			$subId = (int) ( $row['subscription_id_meta'] ?? $row['subscription_id'] ?? 0 );
			if ( $subId <= 0 || empty( $cohortBySub[ $subId ] ) ) {
				continue;
			}
			$cohort = $cohortBySub[ $subId ];
			$paidAt = (string) ( $row['paid_at'] ?? '' );
			if ( $paidAt === '' ) {
				continue;
			}
			$monthsSince = $this->monthsBetween( $cohort, substr( $paidAt, 0, 7 ) );
			if ( $monthsSince < 0 || $monthsSince > 12 ) {
				continue;
			}
			$cents = (int) round( (float) ( $row['order_total'] ?? 0 ) * 100 );
			$matrix[ $cohort ][ $monthsSince ]['members'][ $subId ] = true;
			$matrix[ $cohort ][ $monthsSince ]['revenue_cents'] = ( $matrix[ $cohort ][ $monthsSince ]['revenue_cents'] ?? 0 ) + $cents;
		}

		$cohortSizes = array();
		foreach ( $cohortBySub as $cohort ) {
			$cohortSizes[ $cohort ] = ( $cohortSizes[ $cohort ] ?? 0 ) + 1;
		}

		$result = array();
		foreach ( $cohortSizes as $cohort => $size ) {
			$months            = array();
			$cumulativeRevenue = 0;
			for ( $m = 0; $m <= 12; $m++ ) {
				$cell              = $matrix[ $cohort ][ $m ] ?? array(
					'members' => array(),
					'revenue_cents' => 0,
				);
				$retained          = count( $cell['members'] );
				$cumulativeRevenue += (int) $cell['revenue_cents'];
				$months[]          = array(
					'month'                    => $m,
					'retained'                 => $retained,
					'retention'                => $size > 0 ? $retained / $size : 0.0,
					'cumulative_revenue_cents' => $cumulativeRevenue,
				);
			}

			$result[] = array(
				'cohort'    => $cohort,
				'size'      => $size,
				'months'    => $months,
				'ltv_cents' => $size > 0 ? (int) round( $cumulativeRevenue / $size ) : 0,
			);
		}

		usort( $result, static fn( $a, $b ) => strcmp( (string) $a['cohort'], (string) $b['cohort'] ) );

		return $result;
	}

	private function monthsBetween( string $fromMonth, string $toMonth ): int {
		[$fy, $fm] = array_map( 'intval', explode( '-', $fromMonth ) );
		[$ty, $tm] = array_map( 'intval', explode( '-', $toMonth ) );

		return ( $ty - $fy ) * 12 + ( $tm - $fm );
	}
}
