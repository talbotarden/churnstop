<?php
declare(strict_types=1);

namespace ChurnStop\Winback;

use ChurnStop\License\LicenseManager;

/**
 * Listens to the churnstop_cancellation_resolved action and schedules a
 * per-step winback email queue for customers who actually cancelled. If
 * the customer was saved we do not enqueue anything.
 *
 * Each step gets its own row with a unique unsubscribe token so one-click
 * unsubscribe is self-contained and does not require a login.
 *
 * License-gated: requires the `winback_automation` entitlement (Growth+).
 */
final class WinbackScheduler {

	public const FEATURE = 'winback_automation';

	public const TABLE_QUEUE         = 'churnstop_winback_queue';
	public const TABLE_UNSUBSCRIBES  = 'churnstop_winback_unsubscribes';

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function register(): void {
		add_action( 'churnstop_cancellation_resolved', array( $this, 'onCancellationResolved' ), 20, 2 );
	}

	/**
	 * @param int                  $eventId
	 * @param array<string, mixed> $event
	 */
	public function onCancellationResolved( int $eventId, array $event ): void {
		if ( ! $this->license->has( self::FEATURE ) ) {
			return;
		}

		if ( ( $event['final_status'] ?? '' ) !== 'cancelled' ) {
			return;
		}

		$userId = (int) ( $event['user_id'] ?? 0 );
		$user   = $userId > 0 ? get_userdata( $userId ) : null;
		$email  = $user && is_object( $user ) ? (string) $user->user_email : '';

		if ( $email === '' ) {
			return;
		}

		if ( $this->isUnsubscribed( $email ) ) {
			return;
		}

		// Idempotency: don't enqueue twice for the same event. A
		// cancellation that flips status after the initial resolve would
		// otherwise double-send.
		global $wpdb;
		$queueTable = $wpdb->prefix . self::TABLE_QUEUE;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$existing = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$queueTable} WHERE cancellation_event_id = %d",
				$eventId
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		if ( $existing > 0 ) {
			return;
		}

		$context = $this->buildContext( $user, $email );

		foreach ( WinbackSequence::steps() as $step ) {
			$stepContext                     = $context;
			$stepContext['unsubscribe_line'] = 'Reply STOP or click here to unsubscribe: ' . $context['unsubscribe_base_url'];
			$token                           = bin2hex( random_bytes( 16 ) );
			$unsubscribeUrl                  = add_query_arg(
				array(
					'churnstop_unsubscribe' => $token,
				),
				home_url( '/' )
			);
			$stepContext['unsubscribe_line'] = 'Click to unsubscribe: ' . $unsubscribeUrl;

			$subject = WinbackSequence::render( (string) $step['subject'], $stepContext );
			$body    = WinbackSequence::render( (string) $step['body'], $stepContext );

			$sendAt = gmdate( 'Y-m-d H:i:s', time() + (int) $step['delay_days'] * DAY_IN_SECONDS );

			$wpdb->insert(
				$queueTable,
				array(
					'cancellation_event_id' => $eventId,
					'recipient_email'       => $email,
					'step_number'           => (int) $step['step'],
					'subject'               => $subject,
					'body'                  => $body,
					'send_at'               => $sendAt,
					'status'                => 'queued',
					'unsubscribe_token'     => $token,
					'created_at'            => current_time( 'mysql' ),
				),
				array( '%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
			);
		}
	}

	public function isUnsubscribed( string $email ): bool {
		global $wpdb;
		$table = $wpdb->prefix . self::TABLE_UNSUBSCRIBES;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE email = %s",
				strtolower( $email )
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		return $count > 0;
	}

	public function unsubscribe( string $email ): void {
		global $wpdb;

		$wpdb->insert(
			$wpdb->prefix . self::TABLE_UNSUBSCRIBES,
			array(
				'email'      => strtolower( $email ),
				'created_at' => current_time( 'mysql' ),
			),
			array( '%s', '%s' )
		);

		// Cancel any still-queued emails for this address so the stop is
		// immediate rather than waiting for the sender to check.
		$wpdb->update(
			$wpdb->prefix . self::TABLE_QUEUE,
			array( 'status' => 'stopped' ),
			array(
				'recipient_email' => strtolower( $email ),
				'status'          => 'queued',
			),
			array( '%s' ),
			array( '%s', '%s' )
		);
	}

	/**
	 * @param \WP_User|null $user
	 * @return array<string, string>
	 */
	private function buildContext( $user, string $email ): array {
		$firstName = '';
		if ( $user && is_object( $user ) ) {
			$firstName = (string) ( $user->first_name ?? '' );
			if ( $firstName === '' ) {
				$firstName = (string) ( $user->display_name ?? '' );
			}
		}
		if ( $firstName === '' ) {
			$parts     = explode( '@', $email );
			$firstName = (string) ( $parts[0] ?? 'there' );
		}

		$accountUrl = wc_get_page_permalink( 'myaccount' );
		if ( ! is_string( $accountUrl ) || $accountUrl === '' ) {
			$accountUrl = home_url( '/' );
		}

		return array(
			'first_name'           => $firstName,
			'site_name'            => (string) get_bloginfo( 'name' ),
			'resubscribe_url'      => $accountUrl,
			'unsubscribe_base_url' => home_url( '/?churnstop_unsubscribe=' ),
			'unsubscribe_line'     => '',
		);
	}
}
