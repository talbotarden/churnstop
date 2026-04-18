<?php
declare(strict_types=1);

namespace ChurnStop\License;

/**
 * Manages license activation and paid entitlement checks.
 *
 * The free core never contacts external servers. License activation is opt-in:
 * the customer pastes a key on the License page, we POST it to api.churnstop.org,
 * cache the returned entitlements for 12 hours, and gate premium features on
 * those entitlements.
 *
 * If the license server is unreachable, cached entitlements remain valid.
 */
final class LicenseManager {

	public const ENTITLEMENTS_OPTION = 'churnstop_entitlements';

	public const LICENSE_KEY_OPTION = 'churnstop_license_key';

	public const REFRESH_HOOK = 'churnstop_license_refresh';

	private const API_BASE = 'https://api.churnstop.org';

	private const REFRESH_INTERVAL_HOURS = 12;

	public function has( string $feature ): bool {
		$entitlements = (array) get_option( self::ENTITLEMENTS_OPTION, array() );

		return in_array( $feature, $entitlements['features'] ?? array(), true );
	}

	public function isActive(): bool {
		return (string) get_option( self::LICENSE_KEY_OPTION, '' ) !== '';
	}

	/**
	 * @return array{ok: bool, message?: string}
	 */
	public function activate( string $key ): array {
		$response = wp_remote_post(
			self::API_BASE . '/license/verify',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'platform' => 'woocommerce',
						'key'      => $key,
						'site_url' => home_url(),
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return array(
				'ok'      => false,
				'message' => $response->get_error_message(),
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( $code !== 200 || empty( $body['ok'] ) ) {
			return array(
				'ok'      => false,
				'message' => $body['error'] ?? __( 'License verification failed.', 'churnstop' ),
			);
		}

		update_option( self::LICENSE_KEY_OPTION, $key );
		update_option( self::ENTITLEMENTS_OPTION, $body['entitlements'] ?? array() );

		if ( ! wp_next_scheduled( self::REFRESH_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS * self::REFRESH_INTERVAL_HOURS, 'twicedaily', self::REFRESH_HOOK );
		}

		return array( 'ok' => true );
	}

	public function deactivate(): void {
		delete_option( self::LICENSE_KEY_OPTION );
		delete_option( self::ENTITLEMENTS_OPTION );
		wp_clear_scheduled_hook( self::REFRESH_HOOK );
	}

	/**
	 * Called by the scheduled refresh event. Silent on failure.
	 */
	public function refreshEntitlements(): void {
		$key = (string) get_option( self::LICENSE_KEY_OPTION, '' );

		if ( $key === '' ) {
			return;
		}

		$response = wp_remote_post(
			self::API_BASE . '/license/entitlements',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'platform' => 'woocommerce',
						'key'      => $key,
						'site_url' => home_url(),
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return;
		}

		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( ! empty( $body['entitlements'] ) ) {
			update_option( self::ENTITLEMENTS_OPTION, $body['entitlements'] );
		}
	}
}
