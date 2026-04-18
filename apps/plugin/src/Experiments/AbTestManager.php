<?php
declare(strict_types=1);

namespace ChurnStop\Experiments;

use ChurnStop\License\LicenseManager;

/**
 * A/B testing engine for save flows.
 *
 * Merchants create tests with two or more variants, each of which overrides
 * a slice of a flow's configuration (typically the offer routing table or
 * the default offer). When a cancellation event starts, AbTestManager picks
 * a sticky variant for the user (hashed on user id + test id), records the
 * assignment, and lets the flow engine apply the variant's overrides. When
 * the cancellation resolves (saved or cancelled) the outcome is stamped back
 * onto the assignment row so the significance calculator can read it.
 *
 * Sticky bucketing detail: we always seed the bucket on (user_id, test_id)
 * so the same customer coming back to cancel again sees the same variant.
 * For guest / userless cancellations we fall back to a hash of the
 * subscription id so behaviour is still deterministic per subscription.
 *
 * License gating: the manager short-circuits to "no active test" when the
 * site's entitlements do not include the `ab_testing` feature. All
 * REST-side writes check the same feature.
 */
final class AbTestManager {

	public const FEATURE = 'ab_testing';

	public const TABLE_TESTS       = 'churnstop_ab_tests';
	public const TABLE_ASSIGNMENTS = 'churnstop_ab_assignments';

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function isEnabled(): bool {
		return $this->license->has( self::FEATURE );
	}

	/**
	 * Return the single currently-running test for a given flow, or null.
	 * We intentionally only support one running test per flow at a time;
	 * overlapping variants on the same flow make the math ambiguous.
	 *
	 * @return array<string, mixed>|null
	 */
	public function activeTestForFlow( int $flowId ): ?array {
		if ( ! $this->isEnabled() ) {
			return null;
		}

		global $wpdb;
		$table = $wpdb->prefix . self::TABLE_TESTS;

		// Table names are plugin-owned (wpdb prefix + const); not user input.
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE flow_id = %d AND status = 'running' ORDER BY started_at ASC LIMIT 1",
				$flowId
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		if ( ! $row ) {
			return null;
		}

		$row['variants'] = $this->decodeVariants( (string) $row['variants_json'] );

		return $row;
	}

	/**
	 * Assign (or look up) a sticky variant for this user + test combination.
	 * Hash-bucketed so the same user always lands on the same variant across
	 * cancellation attempts.
	 *
	 * @param array<string, mixed> $test
	 * @return array{variant: string, config: array<string, mixed>}|null
	 */
	public function assignVariant( array $test, int $userId, int $subscriptionId ): ?array {
		$variants = $test['variants'] ?? array();

		if ( ! is_array( $variants ) || count( $variants ) < 2 ) {
			return null;
		}

		$testId = (int) $test['id'];
		$bucketKey = $userId > 0 ? "u{$userId}" : "s{$subscriptionId}";

		global $wpdb;
		$table = $wpdb->prefix . self::TABLE_ASSIGNMENTS;

		if ( $userId > 0 ) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$existing = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT variant FROM {$table} WHERE test_id = %d AND user_id = %d ORDER BY id ASC LIMIT 1",
					$testId,
					$userId
				)
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

			if ( is_string( $existing ) && $existing !== '' ) {
				$config = $this->configForVariant( $variants, $existing );
				if ( $config !== null ) {
					return array(
						'variant' => $existing,
						'config'  => $config,
					);
				}
			}
		}

		// Deterministic hash → bucket. crc32 produces a uniform integer from a
		// seed string; the variant array order is the weight order, so the
		// first N slots of the hash space map to the first variant, etc.
		$totalWeight = 0;
		foreach ( $variants as $variant ) {
			$totalWeight += max( 1, (int) ( $variant['weight'] ?? 1 ) );
		}
		$bucket = crc32( $bucketKey . ':' . $testId ) % max( 1, $totalWeight );
		if ( $bucket < 0 ) {
			$bucket += $totalWeight; // crc32 on 32-bit PHP can be negative.
		}

		$chosen   = $variants[0];
		$cursor   = 0;
		foreach ( $variants as $variant ) {
			$cursor += max( 1, (int) ( $variant['weight'] ?? 1 ) );
			if ( $bucket < $cursor ) {
				$chosen = $variant;
				break;
			}
		}

		return array(
			'variant' => (string) $chosen['name'],
			'config'  => (array) ( $chosen['config'] ?? array() ),
		);
	}

	/**
	 * Persist an assignment row for the event. If an assignment for this
	 * user+test already exists we link the new cancellation_event_id onto
	 * the most recent assignment so repeat cancellations roll up under the
	 * same sticky variant (one assignment row per cancellation, linked back
	 * to the user's bucket).
	 */
	public function recordAssignment( int $testId, string $variant, int $userId, int $cancellationEventId ): int {
		global $wpdb;

		$wpdb->insert(
			$wpdb->prefix . self::TABLE_ASSIGNMENTS,
			array(
				'test_id'               => $testId,
				'user_id'               => $userId,
				'variant'               => $variant,
				'cancellation_event_id' => $cancellationEventId,
				'created_at'            => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%s', '%d', '%s' )
		);

		return (int) $wpdb->insert_id;
	}

	/**
	 * Called when a cancellation event resolves (saved / cancelled). Stamps
	 * the outcome onto the matching assignment row so the significance
	 * calculator can count saves per variant.
	 */
	public function recordOutcome( int $cancellationEventId, string $outcome ): void {
		if ( ! in_array( $outcome, array( 'saved', 'cancelled' ), true ) ) {
			return;
		}

		global $wpdb;
		$table = $wpdb->prefix . self::TABLE_ASSIGNMENTS;

		$wpdb->update(
			$table,
			array( 'outcome' => $outcome ),
			array( 'cancellation_event_id' => $cancellationEventId ),
			array( '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Tally outcomes per variant and compute a two-proportion z-test for the
	 * save rate. Returns one row per variant plus a `leader` block naming
	 * the best-performing variant with its p-value.
	 *
	 * @param array<string, mixed> $test
	 * @return array<string, mixed>
	 */
	public function computeResults( array $test ): array {
		$testId   = (int) $test['id'];
		$variants = $test['variants'] ?? array();

		if ( ! is_array( $variants ) || count( $variants ) < 2 ) {
			return array(
				'variants' => array(),
				'leader' => null,
			);
		}

		global $wpdb;
		$table = $wpdb->prefix . self::TABLE_ASSIGNMENTS;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT variant,
				        COUNT(*) AS attempts,
				        SUM(CASE WHEN outcome = 'saved' THEN 1 ELSE 0 END) AS saved
				 FROM {$table}
				 WHERE test_id = %d AND outcome IS NOT NULL
				 GROUP BY variant",
				$testId
			),
			ARRAY_A
		) ?: array();
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$byVariant = array();
		foreach ( $rows as $row ) {
			$byVariant[ (string) $row['variant'] ] = array(
				'attempts' => (int) $row['attempts'],
				'saved'    => (int) $row['saved'],
			);
		}

		$control = isset( $variants[0]['name'] ) ? (string) $variants[0]['name'] : '';
		$results = array();
		$leader  = null;
		$leaderRate = -1.0;

		foreach ( $variants as $variant ) {
			$name     = (string) $variant['name'];
			$attempts = (int) ( $byVariant[ $name ]['attempts'] ?? 0 );
			$saved    = (int) ( $byVariant[ $name ]['saved'] ?? 0 );
			$rate     = $attempts > 0 ? $saved / $attempts : 0.0;

			$pValue = null;
			$lift   = null;
			if ( $name !== $control && isset( $byVariant[ $control ] ) ) {
				$cAttempts = (int) $byVariant[ $control ]['attempts'];
				$cSaved    = (int) $byVariant[ $control ]['saved'];
				$pValue    = $this->twoProportionP( $cSaved, $cAttempts, $saved, $attempts );
				$cRate     = $cAttempts > 0 ? $cSaved / $cAttempts : 0.0;
				$lift      = $cRate > 0 ? ( $rate - $cRate ) / $cRate : null;
			}

			$results[] = array(
				'variant'   => $name,
				'attempts'  => $attempts,
				'saved'     => $saved,
				'save_rate' => $rate,
				'lift_vs_control' => $lift,
				'p_value'   => $pValue,
			);

			if ( $attempts >= 30 && $rate > $leaderRate ) {
				$leaderRate = $rate;
				$leader     = array(
					'variant'   => $name,
					'save_rate' => $rate,
					'p_value'   => $pValue,
					'significant' => $pValue !== null && $pValue < 0.05,
				);
			}
		}

		return array(
			'variants' => $results,
			'leader'   => $leader,
		);
	}

	/**
	 * Two-proportion z-test. Returns a two-sided p-value for H0: p_a == p_b.
	 * Uses the pooled standard error. Returns null when either arm has zero
	 * attempts (the test is undefined in that case).
	 */
	public function twoProportionP( int $aSaved, int $aAttempts, int $bSaved, int $bAttempts ): ?float {
		if ( $aAttempts <= 0 || $bAttempts <= 0 ) {
			return null;
		}

		$pa     = $aSaved / $aAttempts;
		$pb     = $bSaved / $bAttempts;
		$pooled = ( $aSaved + $bSaved ) / ( $aAttempts + $bAttempts );

		$se = sqrt( $pooled * ( 1 - $pooled ) * ( 1 / $aAttempts + 1 / $bAttempts ) );
		if ( $se <= 0.0 ) {
			return $pa === $pb ? 1.0 : 0.0;
		}

		$z = ( $pb - $pa ) / $se;
		// Two-sided p = 2 * (1 - Phi(|z|)). Approximate Phi via erf.
		$p = 2 * ( 1 - $this->phi( abs( $z ) ) );

		return max( 0.0, min( 1.0, $p ) );
	}

	public function createTest( string $name, int $flowId, array $variants ): int {
		global $wpdb;

		if ( count( $variants ) < 2 ) {
			return 0;
		}

		$wpdb->insert(
			$wpdb->prefix . self::TABLE_TESTS,
			array(
				'name'          => $name,
				'flow_id'       => $flowId,
				'variants_json' => (string) wp_json_encode( array_values( $variants ) ),
				'status'        => 'running',
				'started_at'    => current_time( 'mysql' ),
			),
			array( '%s', '%d', '%s', '%s', '%s' )
		);

		return (int) $wpdb->insert_id;
	}

	public function stopTest( int $testId ): void {
		global $wpdb;

		$wpdb->update(
			$wpdb->prefix . self::TABLE_TESTS,
			array(
				'status'   => 'stopped',
				'ended_at' => current_time( 'mysql' ),
			),
			array( 'id' => $testId ),
			array( '%s', '%s' ),
			array( '%d' )
		);
	}

	public function listTests(): array {
		global $wpdb;
		$table = $wpdb->prefix . self::TABLE_TESTS;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY id DESC", ARRAY_A ) ?: array();
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		foreach ( $rows as &$row ) {
			$row['variants'] = $this->decodeVariants( (string) $row['variants_json'] );
			unset( $row['variants_json'] );
		}

		return $rows;
	}

	/**
	 * Phi: standard-normal CDF via a numerically stable erf approximation
	 * (Abramowitz & Stegun 7.1.26). Accurate to ~1.5e-7 which is plenty
	 * precise for A/B test p-values.
	 */
	private function phi( float $x ): float {
		$t = 1.0 / ( 1.0 + 0.2316419 * $x );
		$d = 0.3989422804014327 * exp( -$x * $x / 2 );
		$p = $d * $t * (
			0.319381530 + $t * (
				-0.356563782 + $t * (
					1.781477937 + $t * (
						-1.821255978 + $t * 1.330274429
					)
				)
			)
		);

		return 1.0 - $p;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	private function configForVariant( array $variants, string $name ): ?array {
		foreach ( $variants as $variant ) {
			if ( (string) ( $variant['name'] ?? '' ) === $name ) {
				return (array) ( $variant['config'] ?? array() );
			}
		}

		return null;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	private function decodeVariants( string $json ): array {
		$decoded = json_decode( $json, true );

		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$clean = array();
		foreach ( $decoded as $variant ) {
			if ( ! is_array( $variant ) || empty( $variant['name'] ) ) {
				continue;
			}
			$clean[] = array(
				'name'   => (string) $variant['name'],
				'weight' => max( 1, (int) ( $variant['weight'] ?? 1 ) ),
				'config' => (array) ( $variant['config'] ?? array() ),
			);
		}

		return $clean;
	}
}
