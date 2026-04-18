<?php
declare(strict_types=1);

namespace ChurnStop\Winback;

use ChurnStop\License\LicenseManager;

/**
 * One-click unsubscribe. Listens for ?churnstop_unsubscribe=<token> on
 * any front-end request; when a matching queue row is found we mark the
 * address as unsubscribed, cancel all queued emails for that recipient,
 * and render a tiny confirmation page. Tokens are invalidated after the
 * first use so the same URL cannot be reused to probe for other emails.
 */
final class UnsubscribeHandler {

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function register(): void {
		add_action( 'init', array( $this, 'maybeHandle' ) );
	}

	public function maybeHandle(): void {
		if ( empty( $_GET['churnstop_unsubscribe'] ) ) {
			return;
		}

		$token = sanitize_text_field( wp_unslash( (string) $_GET['churnstop_unsubscribe'] ) );
		if ( strlen( $token ) !== 32 || ! ctype_xdigit( $token ) ) {
			$this->renderPage( __( 'This unsubscribe link is invalid.', 'churnstop' ) );
			return;
		}

		global $wpdb;
		$queueTable = $wpdb->prefix . WinbackScheduler::TABLE_QUEUE;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, recipient_email FROM {$queueTable} WHERE unsubscribe_token = %s LIMIT 1",
				$token
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		if ( ! $row ) {
			$this->renderPage( __( 'This unsubscribe link has expired.', 'churnstop' ) );
			return;
		}

		$scheduler = new WinbackScheduler( $this->license );
		$scheduler->unsubscribe( (string) $row['recipient_email'] );

		$this->renderPage( __( 'You have been unsubscribed. No more winback emails will be sent to this address.', 'churnstop' ) );
	}

	private function renderPage( string $message ): void {
		status_header( 200 );
		nocache_headers();

		echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>';
		echo esc_html__( 'Unsubscribe', 'churnstop' );
		echo '</title><meta name="robots" content="noindex"></head>';
		echo '<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 24px; line-height: 1.5;">';
		echo '<h1 style="font-size: 20px; margin: 0 0 16px;">' . esc_html__( 'Unsubscribe', 'churnstop' ) . '</h1>';
		echo '<p>' . esc_html( $message ) . '</p>';
		echo '</body></html>';
		exit;
	}
}
