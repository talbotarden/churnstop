<?php
declare(strict_types=1);

namespace ChurnStop\Privacy;

/**
 * Integrates with WordPress core's personal-data exporter and eraser APIs
 * (Tools > Export Personal Data / Erase Personal Data). Registers ChurnStop
 * as a data source so GDPR Article 17 and CCPA deletion requests that go
 * through WP core also delete the customer's ChurnStop rows.
 *
 * Two exported action hooks let external code plug into the same lifecycle:
 *
 *  - churnstop_data_export(int $userId, array $rows): called during export.
 *  - churnstop_data_erase(int $userId, array $rowIds): called during erasure.
 *
 * These fire regardless of whether the merchant uses the WP core admin UI
 * or invokes the class directly from a custom compliance dashboard.
 */
final class DataSubjectHandlers {

	public function register(): void {
		add_filter( 'wp_privacy_personal_data_exporters', array( $this, 'registerExporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( $this, 'registerEraser' ) );
	}

	/**
	 * @param array<string, array<string, mixed>> $exporters
	 * @return array<string, array<string, mixed>>
	 */
	public function registerExporter( array $exporters ): array {
		$exporters['churnstop'] = array(
			'exporter_friendly_name' => __( 'ChurnStop cancellation events', 'churnstop' ),
			'callback'               => array( $this, 'exportData' ),
		);

		return $exporters;
	}

	/**
	 * @param array<string, array<string, mixed>> $erasers
	 * @return array<string, array<string, mixed>>
	 */
	public function registerEraser( array $erasers ): array {
		$erasers['churnstop'] = array(
			'eraser_friendly_name' => __( 'ChurnStop cancellation events', 'churnstop' ),
			'callback'             => array( $this, 'eraseData' ),
		);

		return $erasers;
	}

	/**
	 * Assemble the data export. WP core calls this with the user's email;
	 * we resolve to user id and pull rows from the cancellation_events table.
	 *
	 * @param string $email Email address of the data subject.
	 * @param int    $page  Pagination cursor; core pages exporters.
	 *
	 * @return array{data: array<int, array{group_id: string, group_label: string, item_id: string, data: array<int, array{name: string, value: string}>}>, done: bool}
	 */
	public function exportData( string $email, int $page = 1 ): array {
		$user = get_user_by( 'email', $email );

		if ( ! $user ) {
			return array(
				'data' => array(),
				'done' => true,
			);
		}

		global $wpdb;

		$perPage = 50;
		$offset  = ( max( 1, $page ) - 1 ) * $perPage;

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, subscription_id, platform, external_subscription_id, cancel_reason, offer_shown,
				        offer_accepted, final_status, monthly_value_cents, created_at, resolved_at
				 FROM {$wpdb->prefix}churnstop_cancellation_events
				 WHERE user_id = %d
				 ORDER BY id DESC
				 LIMIT %d OFFSET %d",
				(int) $user->ID,
				$perPage,
				$offset
			),
			ARRAY_A
		);

		$data = array();

		foreach ( (array) $rows as $row ) {
			$data[] = array(
				'group_id'    => 'churnstop-events',
				'group_label' => (string) __( 'Cancellation save-flow events', 'churnstop' ),
				'item_id'     => 'churnstop-event-' . (int) $row['id'],
				'data'        => array(
					array(
						'name' => (string) __( 'Subscription ID', 'churnstop' ),
						'value' => (string) $row['subscription_id'],
					),
					array(
						'name' => (string) __( 'Platform', 'churnstop' ),
						'value' => (string) $row['platform'],
					),
					array(
						'name' => (string) __( 'External subscription ID', 'churnstop' ),
						'value' => (string) $row['external_subscription_id'],
					),
					array(
						'name' => (string) __( 'Cancel reason', 'churnstop' ),
						'value' => (string) ( $row['cancel_reason'] ?? '' ),
					),
					array(
						'name' => (string) __( 'Offer shown', 'churnstop' ),
						'value' => (string) ( $row['offer_shown'] ?? '' ),
					),
					array(
						'name' => (string) __( 'Offer accepted', 'churnstop' ),
						'value' => ( (int) $row['offer_accepted'] === 1 ) ? 'yes' : 'no',
					),
					array(
						'name' => (string) __( 'Final status', 'churnstop' ),
						'value' => (string) $row['final_status'],
					),
					array(
						'name' => (string) __( 'Monthly value (cents)', 'churnstop' ),
						'value' => (string) $row['monthly_value_cents'],
					),
					array(
						'name' => (string) __( 'Created at', 'churnstop' ),
						'value' => (string) $row['created_at'],
					),
					array(
						'name' => (string) __( 'Resolved at', 'churnstop' ),
						'value' => (string) ( $row['resolved_at'] ?? '' ),
					),
				),
			);
		}

		/**
		 * Fires during a GDPR / CCPA data export for this user. Third-party
		 * code that also stores ChurnStop-adjacent data (custom analytics,
		 * audit log) can append to $data via a callback bound to this hook.
		 *
		 * @param int                  $userId
		 * @param array<int, array<string, mixed>> $rows Current exporter rows.
		 */
		do_action( 'churnstop_data_export', (int) $user->ID, $data );

		return array(
			'data' => $data,
			'done' => count( (array) $rows ) < $perPage,
		);
	}

	/**
	 * Delete ChurnStop rows for the data subject. Page through the user's
	 * events and delete them a batch at a time so WP core's progress meter
	 * behaves correctly.
	 *
	 * @return array{items_removed: int, items_retained: int, messages: array<int, string>, done: bool}
	 */
	public function eraseData( string $email, int $page = 1 ): array {
		$user = get_user_by( 'email', $email );

		if ( ! $user ) {
			return array(
				'items_removed'  => 0,
				'items_retained' => 0,
				'messages'       => array(),
				'done'           => true,
			);
		}

		global $wpdb;

		$perPage = 100;
		$offset  = ( max( 1, $page ) - 1 ) * $perPage;

		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT id FROM {$wpdb->prefix}churnstop_cancellation_events
				 WHERE user_id = %d
				 ORDER BY id DESC
				 LIMIT %d OFFSET %d",
				(int) $user->ID,
				$perPage,
				$offset
			)
		);

		$removed = 0;

		if ( ! empty( $ids ) ) {
			$intIds = array_map( 'intval', $ids );
			// Variable-length IN clause. Placeholder string is generated from a
			// bounded integer count (capped at $perPage = 100) and never from
			// user input; values pass through $wpdb->prepare().
			$placeholders = implode( ',', array_fill( 0, count( $intIds ), '%d' ) );

			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
			$removed = (int) $wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->prefix}churnstop_cancellation_events WHERE id IN ($placeholders)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
					...$intIds
				)
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare

			/**
			 * Fires after deletion of this user's ChurnStop rows, with the
			 * list of deleted ids so downstream systems can mirror the erasure
			 * (benchmark tables, analytics warehouses).
			 *
			 * @param int                $userId
			 * @param array<int, int>    $rowIds Deleted row ids.
			 */
			do_action( 'churnstop_data_erase', (int) $user->ID, $intIds );
		}

		return array(
			'items_removed'  => $removed,
			'items_retained' => 0,
			'messages'       => array(),
			'done'           => count( (array) $ids ) < $perPage,
		);
	}
}
