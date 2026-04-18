<?php
declare(strict_types=1);

namespace ChurnStop\Core;

/**
 * Central settings storage. Merchant-configurable defaults for the modal copy,
 * offer amounts, pause duration, cancel reasons, and branding.
 *
 * Compliance-critical fields (the cancel-button text rule, multi-step
 * cancellation gating) cannot be overridden here; they live in the
 * ClickToCancel class and validate on save.
 */
final class Settings {

	public const OPTION_KEY = 'churnstop_settings';

	/**
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return array(
			'modal_heading'            => __( 'Before you go...', 'churnstop' ),
			'accent_color'             => '#0f1419',
			'cancel_button_text'       => __( 'No thanks, cancel my subscription', 'churnstop' ),

			'default_discount_percent' => 20,
			'default_discount_cycles'  => 3,
			'default_pause_days'       => 30,

			'cancel_reasons'           => array(
				array(
					'id'      => 'too_expensive',
					'label'   => __( 'Too expensive', 'churnstop' ),
					'enabled' => true,
				),
				array(
					'id'      => 'not_using',
					'label'   => __( 'Not using it enough', 'churnstop' ),
					'enabled' => true,
				),
				array(
					'id'      => 'missing_feature',
					'label'   => __( 'Missing a feature I need', 'churnstop' ),
					'enabled' => true,
				),
				array(
					'id'      => 'switching',
					'label'   => __( 'Switching to a different tool', 'churnstop' ),
					'enabled' => true,
				),
				array(
					'id'      => 'technical',
					'label'   => __( 'Technical issues', 'churnstop' ),
					'enabled' => true,
				),
				array(
					'id'      => 'other',
					'label'   => __( 'Other', 'churnstop' ),
					'enabled' => true,
				),
			),

			'open_text_followup'       => true,
			'open_text_required'       => false,
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	public static function all(): array {
		$stored = get_option( self::OPTION_KEY, array() );

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return array_replace_recursive( self::defaults(), $stored );
	}

	/**
	 * @param string $key
	 * @param mixed  $default
	 *
	 * @return mixed
	 */
	public static function get( string $key, $default = null ) {
		$all = self::all();

		return $all[ $key ] ?? $default;
	}

	/**
	 * @param array<string, mixed> $incoming
	 *
	 * @return array<string, mixed>
	 */
	public static function update( array $incoming ): array {
		$sanitised = self::sanitise( $incoming );
		update_option( self::OPTION_KEY, $sanitised );

		return self::all();
	}

	/**
	 * Accepts untrusted input and returns a safe, typed array.
	 *
	 * @param array<string, mixed> $in
	 *
	 * @return array<string, mixed>
	 */
	private static function sanitise( array $in ): array {
		$out = array();

		if ( isset( $in['modal_heading'] ) ) {
			$out['modal_heading'] = sanitize_text_field( (string) $in['modal_heading'] );
		}

		if ( isset( $in['accent_color'] ) ) {
			$colour = sanitize_hex_color( (string) $in['accent_color'] );

			if ( $colour ) {
				$out['accent_color'] = $colour;
			}
		}

		if ( isset( $in['cancel_button_text'] ) ) {
			$out['cancel_button_text'] = sanitize_text_field( (string) $in['cancel_button_text'] );
		}

		if ( isset( $in['default_discount_percent'] ) ) {
			$out['default_discount_percent'] = max( 1, min( 90, (int) $in['default_discount_percent'] ) );
		}

		if ( isset( $in['default_discount_cycles'] ) ) {
			$out['default_discount_cycles'] = max( 1, min( 36, (int) $in['default_discount_cycles'] ) );
		}

		if ( isset( $in['default_pause_days'] ) ) {
			$out['default_pause_days'] = max( 1, min( 180, (int) $in['default_pause_days'] ) );
		}

		if ( isset( $in['open_text_followup'] ) ) {
			$out['open_text_followup'] = (bool) $in['open_text_followup'];
		}

		if ( isset( $in['open_text_required'] ) ) {
			$out['open_text_required'] = (bool) $in['open_text_required'];
		}

		if ( isset( $in['cancel_reasons'] ) && is_array( $in['cancel_reasons'] ) ) {
			$out['cancel_reasons'] = array();

			foreach ( $in['cancel_reasons'] as $reason ) {
				if ( ! is_array( $reason ) || empty( $reason['id'] ) || empty( $reason['label'] ) ) {
					continue;
				}

				$out['cancel_reasons'][] = array(
					'id'      => sanitize_key( (string) $reason['id'] ),
					'label'   => sanitize_text_field( (string) $reason['label'] ),
					'enabled' => ! empty( $reason['enabled'] ),
				);
			}
		}

		return $out;
	}
}
