<?php
declare(strict_types=1);

namespace ChurnStop\Winback;

use ChurnStop\License\LicenseManager;

/**
 * WP-cron-driven email sender. Hooks a recurring action that pulls due
 * winback jobs from the queue, applies stop rules (unsubscribe,
 * resubscribed), and sends via wp_mail. Failures are recorded on the row
 * so operators can retry manually.
 *
 * The cron runs every 15 minutes. Each run processes at most 25 emails
 * to stay under wp_mail's typical rate ceiling on shared hosts.
 */
final class WinbackSender {

	public const CRON_HOOK = 'churnstop_winback_tick';

	private const CRON_RECURRENCE = 'churnstop_fifteen_minutes';

	private const BATCH_SIZE = 25;

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function register(): void {
		add_filter( 'cron_schedules', array( $this, 'registerSchedule' ) );
		add_action( self::CRON_HOOK, array( $this, 'tick' ) );
		add_action( 'init', array( $this, 'maybeSchedule' ) );
	}

	/**
	 * @param array<string, array{interval: int, display: string}> $schedules
	 * @return array<string, array{interval: int, display: string}>
	 */
	public function registerSchedule( array $schedules ): array {
		if ( ! isset( $schedules[ self::CRON_RECURRENCE ] ) ) {
			$schedules[ self::CRON_RECURRENCE ] = array(
				'interval' => 15 * MINUTE_IN_SECONDS,
				'display'  => __( 'Every 15 minutes (ChurnStop)', 'churnstop' ),
			);
		}

		return $schedules;
	}

	public function maybeSchedule(): void {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + 5 * MINUTE_IN_SECONDS, self::CRON_RECURRENCE, self::CRON_HOOK );
		}
	}

	public function tick(): void {
		if ( ! $this->license->has( WinbackScheduler::FEATURE ) ) {
			return;
		}

		global $wpdb;
		$queueTable = $wpdb->prefix . WinbackScheduler::TABLE_QUEUE;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$queueTable}
				  WHERE status = 'queued'
				    AND send_at <= %s
				  ORDER BY send_at ASC
				  LIMIT %d",
				gmdate( 'Y-m-d H:i:s' ),
				self::BATCH_SIZE
			),
			ARRAY_A
		) ?: array();
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$scheduler = new WinbackScheduler( $this->license );

		foreach ( $rows as $row ) {
			$id    = (int) $row['id'];
			$email = (string) $row['recipient_email'];

			if ( $scheduler->isUnsubscribed( $email ) ) {
				$this->markStopped( $id, 'unsubscribed' );
				continue;
			}

			if ( $this->customerReactivated( (int) $row['cancellation_event_id'] ) ) {
				$this->markStopped( $id, 'resubscribed' );
				continue;
			}

			$headers = array(
				'Content-Type: text/plain; charset=UTF-8',
				sprintf( 'List-Unsubscribe: <%s>', add_query_arg( 'churnstop_unsubscribe', (string) $row['unsubscribe_token'], home_url( '/' ) ) ),
				'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
			);

			$ok = wp_mail( $email, (string) $row['subject'], (string) $row['body'], $headers );

			if ( $ok ) {
				$wpdb->update(
					$queueTable,
					array(
						'status'  => 'sent',
						'sent_at' => current_time( 'mysql' ),
					),
					array( 'id' => $id ),
					array( '%s', '%s' ),
					array( '%d' )
				);
			} else {
				$wpdb->update(
					$queueTable,
					array(
						'status'    => 'failed',
						'error_msg' => 'wp_mail returned false',
					),
					array( 'id' => $id ),
					array( '%s', '%s' ),
					array( '%d' )
				);
			}
		}
	}

	private function markStopped( int $id, string $reason ): void {
		global $wpdb;

		$wpdb->update(
			$wpdb->prefix . WinbackScheduler::TABLE_QUEUE,
			array(
				'status'    => 'stopped',
				'error_msg' => $reason,
			),
			array( 'id' => $id ),
			array( '%s', '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Has the customer reactivated any subscription since the cancellation
	 * event? The cheapest check is to look up the user id on the event row
	 * and ask WC Subs for active subscriptions. If the user is no longer
	 * around (deleted account) we treat that as "do not contact" too.
	 */
	private function customerReactivated( int $eventId ): bool {
		global $wpdb;
		$eventsTable = $wpdb->prefix . 'churnstop_cancellation_events';

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$userId = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT user_id FROM {$eventsTable} WHERE id = %d",
				$eventId
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		if ( $userId <= 0 ) {
			return true;
		}

		if ( ! function_exists( 'wcs_user_has_subscription' ) ) {
			return false;
		}

		return (bool) wcs_user_has_subscription( $userId, '', 'active' );
	}
}
