<?php
declare(strict_types=1);

namespace ChurnStop\Core;

use ChurnStop\Database\Migrations;

/**
 * Runs on plugin activation. Creates tables and seeds the default flow.
 */
final class Activator {

	public const MIN_WP_VERSION      = '6.0';
	public const MIN_WC_VERSION      = '8.0';
	public const MIN_WC_SUBS_VERSION = '4.0';
	public const MIN_PHP_VERSION     = '7.4';

	public static function activate(): void {
		$issue = self::preflight();

		if ( $issue !== null ) {
			deactivate_plugins( plugin_basename( CHURNSTOP_FILE ) );
			wp_die(
				esc_html( $issue ),
				esc_html__( 'ChurnStop cannot activate', 'churnstop' ),
				array(
					'back_link' => true,
					'response'  => 200,
				)
			);
		}

		Migrations::run();

		// Seed default flow on first activation only.
		if ( ! get_option( 'churnstop_default_flow_seeded' ) ) {
			self::seedDefaultFlow();
			update_option( 'churnstop_default_flow_seeded', 1 );
		}

		// Flag for welcome redirect on next admin page load.
		set_transient( 'churnstop_activation_redirect', 1, 30 );
	}

	/**
	 * Check the runtime for minimum PHP, WP, WC, and WC Subscriptions versions.
	 * Returns a user-facing message on failure, or null when all gates pass.
	 */
	public static function preflight(): ?string {
		if ( version_compare( PHP_VERSION, self::MIN_PHP_VERSION, '<' ) ) {
			return sprintf(
				/* translators: 1: required PHP version, 2: current PHP version */
				__( 'ChurnStop requires PHP %1$s or newer. Your server is running %2$s. Update PHP to activate the plugin.', 'churnstop' ),
				self::MIN_PHP_VERSION,
				PHP_VERSION
			);
		}

		global $wp_version;
		if ( version_compare( (string) $wp_version, self::MIN_WP_VERSION, '<' ) ) {
			return sprintf(
				/* translators: 1: required WP version, 2: current WP version */
				__( 'ChurnStop requires WordPress %1$s or newer. You are running %2$s.', 'churnstop' ),
				self::MIN_WP_VERSION,
				(string) $wp_version
			);
		}

		if ( ! defined( 'WC_VERSION' ) || version_compare( (string) WC_VERSION, self::MIN_WC_VERSION, '<' ) ) {
			return sprintf(
				/* translators: %s: required WooCommerce version */
				__( 'ChurnStop requires WooCommerce %s or newer, active and installed. Install WooCommerce first, then activate ChurnStop.', 'churnstop' ),
				self::MIN_WC_VERSION
			);
		}

		if ( ! class_exists( '\WC_Subscriptions' ) ) {
			return sprintf(
				/* translators: %s: required WooCommerce Subscriptions version */
				__( 'ChurnStop requires WooCommerce Subscriptions %s or newer. Install and activate WC Subscriptions before ChurnStop.', 'churnstop' ),
				self::MIN_WC_SUBS_VERSION
			);
		}

		if ( property_exists( '\WC_Subscriptions', 'version' ) ) {
			$subsVersion = (string) \WC_Subscriptions::$version;
			if ( $subsVersion !== '' && version_compare( $subsVersion, self::MIN_WC_SUBS_VERSION, '<' ) ) {
				return sprintf(
					/* translators: 1: required WC Subs version, 2: current WC Subs version */
					__( 'ChurnStop requires WooCommerce Subscriptions %1$s or newer. You are running %2$s.', 'churnstop' ),
					self::MIN_WC_SUBS_VERSION,
					$subsVersion
				);
			}
		}

		return null;
	}

	private static function seedDefaultFlow(): void {
		global $wpdb;

		$flowsTable = $wpdb->prefix . 'churnstop_flows';
		$stepsTable = $wpdb->prefix . 'churnstop_flow_steps';

		/**
		 * Survey step config. Merchants who prefer to seed the default flow from
		 * their own code (theme functions.php, a sibling plugin) can return a
		 * modified array to change reasons, question wording, or the follow-up
		 * text behaviour without editing ChurnStop source.
		 */
		$surveyConfig = apply_filters(
			'churnstop_default_flow_survey',
			array(
				'question'           => 'What is your main reason for cancelling?',
				'required'           => true,
				'options'            => array(
					array(
						'id'    => 'too_expensive',
						'label' => 'Too expensive',
					),
					array(
						'id'    => 'not_using',
						'label' => 'Not using it enough',
					),
					array(
						'id'    => 'missing_feature',
						'label' => 'Missing a feature I need',
					),
					array(
						'id'    => 'switching',
						'label' => 'Switching to a different tool',
					),
					array(
						'id'    => 'technical',
						'label' => 'Technical issues',
					),
					array(
						'id'    => 'other',
						'label' => 'Other',
					),
				),
				'open_text_followup' => true,
				'open_text_required' => false,
			)
		);

		$wpdb->insert(
			$flowsTable,
			array(
				'name'          => 'Default Cancellation Flow',
				'trigger_event' => 'wc_subs_cancel_clicked',
				'is_active'     => 1,
				'created_at'    => current_time( 'mysql' ),
			)
		);

		$flowId = (int) $wpdb->insert_id;

		// Step 1: survey.
		$wpdb->insert(
			$stepsTable,
			array(
				'flow_id'     => $flowId,
				'step_order'  => 1,
				'step_type'   => 'survey',
				'config_json' => wp_json_encode( $surveyConfig ),
			)
		);

		/**
		 * Default offer config. Bind to churnstop_default_flow_offers to seed
		 * different defaults (per-reason offers, different amounts) without
		 * editing ChurnStop source.
		 */
		$offerConfig = apply_filters(
			'churnstop_default_flow_offers',
			array(
				'default_offer' => array(
					'type'                    => 'discount',
					'value'                   => 20,
					'duration_billing_cycles' => 3,
				),
				'conditional'   => array(
					'too_expensive' => array(
						'type'                    => 'discount',
						'value'                   => 25,
						'duration_billing_cycles' => 3,
					),
					'not_using'     => array(
						'type'          => 'pause',
						'duration_days' => 30,
					),
					'switching'     => array(
						'type'                    => 'discount',
						'value'                   => 30,
						'duration_billing_cycles' => 6,
					),
					'technical'     => array( 'type' => 'support_route' ),
				),
			)
		);

		// Step 2: offer.
		$wpdb->insert(
			$stepsTable,
			array(
				'flow_id'     => $flowId,
				'step_order'  => 2,
				'step_type'   => 'offer',
				'config_json' => wp_json_encode( $offerConfig ),
			)
		);

		/**
		 * Top-level seed hook. Fires after the default survey + offer steps
		 * are written; receives the new flow id so third-party seeders can
		 * append extra steps, flag the flow as a variant for A/B testing, or
		 * add admin notes.
		 *
		 * @param int   $flowId       ID of the newly-inserted flow.
		 * @param array $surveyConfig Final survey config written to DB.
		 * @param array $offerConfig  Final offer config written to DB.
		 */
		do_action( 'churnstop_default_flow_seeded', $flowId, $surveyConfig, $offerConfig );
	}
}
