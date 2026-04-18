<?php
declare(strict_types=1);

namespace ChurnStop\Flow;

use ChurnStop\Core\Settings;
use ChurnStop\License\LicenseManager;

/**
 * The core flow runtime. Given a subscription cancellation attempt, this engine
 * picks a flow, advances steps, picks the offer based on survey answers, and
 * applies offers via the WC Subs APIs.
 *
 * For phase 1 this implements the single default flow and two offer types
 * (discount, pause). Later phases add branching, A/B, and more offer types.
 */
final class FlowEngine {

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	/**
	 * Start a flow for a given subscription. Creates a cancellation_event row.
	 *
	 * @return array<string, mixed> JSON-serialisable payload for the frontend.
	 */
	public function startForSubscription( int $subscriptionId ): array {
		global $wpdb;

		$flow = $this->getActiveFlow();

		if ( $flow === null ) {
			return array( 'no_flow' => true );
		}

		$subscription = wcs_get_subscription( $subscriptionId );
		$monthlyValue = $subscription ? (int) round( (float) $subscription->get_total() * 100 ) : 0;

		// PLATFORM_ADAPTER: write the abstract (platform, external_subscription_id)
		// pair alongside the WC-scoped integer so Phase 2 universal reads work
		// without a backfill. external_subscription_id is always a string at the
		// boundary; the column is VARCHAR(128) by design.
		$wpdb->insert(
			$wpdb->prefix . 'churnstop_cancellation_events',
			array(
				'user_id'                  => get_current_user_id(),
				'subscription_id'          => $subscriptionId,
				'platform'                 => 'woocommerce',
				'external_subscription_id' => (string) $subscriptionId,
				'flow_id'                  => (int) $flow['id'],
				'final_status'             => 'in_progress',
				'monthly_value_cents'      => $monthlyValue,
				'created_at'               => current_time( 'mysql' ),
			)
		);

		$eventId = (int) $wpdb->insert_id;

		$firstStep = $this->getFirstStep( (int) $flow['id'] );

		return array(
			'event_id' => $eventId,
			'step'     => $firstStep,
		);
	}

	/**
	 * Record the survey answer and advance to the offer step.
	 *
	 * @return array<string, mixed>
	 */
	public function submitSurvey( int $eventId, string $reason, string $freeText ): array {
		global $wpdb;

		$wpdb->update(
			$wpdb->prefix . 'churnstop_cancellation_events',
			array(
				'cancel_reason'        => $reason,
				'survey_response_json' => wp_json_encode(
					array(
						'reason'    => $reason,
						'free_text' => $freeText,
					)
				),
			),
			array( 'id' => $eventId )
		);

		$event     = $this->getEvent( $eventId );
		$offerStep = $this->getOfferStep( (int) $event['flow_id'] );

		if ( $offerStep === null ) {
			return $this->declineAndCancel( $eventId );
		}

		$config = json_decode( $offerStep['config_json'], true );
		$offer  = $config['conditional'][ $reason ] ?? $config['default_offer'] ?? null;

		return array(
			'step' => array(
				'type'  => 'offer',
				'offer' => $offer,
			),
		);
	}

	/**
	 * Apply the offer to the subscription. Discount issues a coupon; pause sets
	 * the subscription to on-hold for N days.
	 *
	 * @return array<string, mixed>
	 */
	public function acceptOffer( int $eventId ): array {
		global $wpdb;

		$event     = $this->getEvent( $eventId );
		$offerStep = $this->getOfferStep( (int) $event['flow_id'] );
		$config    = json_decode( $offerStep['config_json'], true );
		$offer     = $config['conditional'][ $event['cancel_reason'] ] ?? $config['default_offer'];

		$subscription = wcs_get_subscription( (int) $event['subscription_id'] );

		if ( ! $subscription ) {
			return array( 'error' => 'Subscription not found' );
		}

		switch ( $offer['type'] ) {
			case 'discount':
				$this->applyDiscount( $subscription, $offer );
				break;
			case 'pause':
				$this->applyPause( $subscription, $offer );
				break;
			case 'skip_renewal':
				$this->skipNextRenewal( $subscription );
				break;
			default:
				// Unknown offer type; decline safely.
				return $this->declineAndCancel( $eventId );
		}

		$wpdb->update(
			$wpdb->prefix . 'churnstop_cancellation_events',
			array(
				'offer_shown'    => $offer['type'],
				'offer_accepted' => 1,
				'final_status'   => 'saved',
				'resolved_at'    => current_time( 'mysql' ),
			),
			array( 'id' => $eventId )
		);

		return array(
			'saved' => true,
			'offer' => $offer,
		);
	}

	/**
	 * Complete cancellation. Called when the customer clicks "No thanks, cancel".
	 *
	 * @return array<string, mixed>
	 */
	public function declineAndCancel( int $eventId ): array {
		global $wpdb;

		$event        = $this->getEvent( $eventId );
		$subscription = wcs_get_subscription( (int) $event['subscription_id'] );

		if ( $subscription ) {
			$subscription->update_status( 'cancelled', __( 'Cancelled via ChurnStop flow', 'churnstop' ) );
		}

		$wpdb->update(
			$wpdb->prefix . 'churnstop_cancellation_events',
			array(
				'final_status' => 'cancelled',
				'resolved_at'  => current_time( 'mysql' ),
			),
			array( 'id' => $eventId )
		);

		return array( 'cancelled' => true );
	}

	/**
	 * Apply a percent-off discount to the next N renewals via a WC coupon.
	 *
	 * @platform-adapter woocommerce - Phase 2 will mirror this via apps/api/adapters/woocommerce.ts if we move flow execution server-side.
	 *
	 * @param array<string, mixed> $offer
	 */
	// PLATFORM_ADAPTER: discount application is WC-specific in Phase 1.
	private function applyDiscount( \WC_Subscription $subscription, array $offer ): void {
		$percentage = (int) ( $offer['value'] ?? Settings::get( 'default_discount_percent', 20 ) );
		$cycles     = (int) ( $offer['duration_billing_cycles'] ?? Settings::get( 'default_discount_cycles', 3 ) );

		// Issue a one-shot coupon applied to the next $cycles renewals.
		$couponCode = 'CS-' . strtoupper( wp_generate_password( 8, false, false ) );

		$coupon = new \WC_Coupon();
		$coupon->set_code( $couponCode );
		$coupon->set_discount_type( 'percent' );
		$coupon->set_amount( (string) $percentage );
		$coupon->set_usage_limit( $cycles );
		$coupon->set_individual_use( true );
		$coupon->set_email_restrictions( array( $subscription->get_billing_email() ) );
		$coupon->save();

		// Store linkage for renewal hook to auto-apply.
		update_post_meta( $subscription->get_id(), '_churnstop_save_coupon', $couponCode );
		update_post_meta( $subscription->get_id(), '_churnstop_save_coupon_cycles_remaining', $cycles );
	}

	/**
	 * Pause the subscription by pushing next_payment forward N days and moving status to on-hold.
	 *
	 * @platform-adapter woocommerce - Phase 2 will mirror this via apps/api/adapters/woocommerce.ts if we move flow execution server-side.
	 *
	 * @param array<string, mixed> $offer
	 */
	// PLATFORM_ADAPTER: pause semantics are WC Subs-specific in Phase 1.
	private function applyPause( \WC_Subscription $subscription, array $offer ): void {
		$days = (int) ( $offer['duration_days'] ?? Settings::get( 'default_pause_days', 30 ) );

		$nextPayment = strtotime( sprintf( '+%d days', $days ) );

		if ( $nextPayment ) {
			$subscription->update_dates( array( 'next_payment' => gmdate( 'Y-m-d H:i:s', $nextPayment ) ) );
		}

		$subscription->update_status( 'on-hold', __( 'Paused via ChurnStop save flow', 'churnstop' ) );
	}

	/**
	 * Skip the next renewal by advancing next_payment by one billing interval.
	 *
	 * @platform-adapter woocommerce - Phase 2 will mirror this via apps/api/adapters/woocommerce.ts if we move flow execution server-side.
	 */
	// PLATFORM_ADAPTER: renewal skip uses WC Subs date helpers in Phase 1.
	private function skipNextRenewal( \WC_Subscription $subscription ): void {
		$currentNext = $subscription->get_date( 'next_payment' );
		$period      = $subscription->get_billing_period();
		$interval    = $subscription->get_billing_interval();

		$skipTo = strtotime( "+$interval $period", strtotime( $currentNext ) );

		if ( $skipTo ) {
			$subscription->update_dates( array( 'next_payment' => gmdate( 'Y-m-d H:i:s', $skipTo ) ) );
		}
	}

	/**
	 * @return array<string, mixed>|null
	 */
	private function getActiveFlow(): ?array {
		global $wpdb;

		$row = $wpdb->get_row(
			"SELECT * FROM {$wpdb->prefix}churnstop_flows WHERE is_active = 1 ORDER BY id ASC LIMIT 1",
			ARRAY_A
		);

		return $row ?: null;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	private function getFirstStep( int $flowId ): ?array {
		global $wpdb;

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}churnstop_flow_steps WHERE flow_id = %d ORDER BY step_order ASC LIMIT 1",
				$flowId
			),
			ARRAY_A
		);

		if ( ! $row ) {
			return null;
		}

		return array(
			'type'   => $row['step_type'],
			'config' => json_decode( (string) $row['config_json'], true ),
		);
	}

	/**
	 * @return array<string, mixed>|null
	 */
	private function getOfferStep( int $flowId ): ?array {
		global $wpdb;

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}churnstop_flow_steps WHERE flow_id = %d AND step_type = 'offer' ORDER BY step_order ASC LIMIT 1",
				$flowId
			),
			ARRAY_A
		);

		return $row ?: null;
	}

	/**
	 * @return array<string, mixed>
	 */
	private function getEvent( int $eventId ): array {
		global $wpdb;

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}churnstop_cancellation_events WHERE id = %d",
				$eventId
			),
			ARRAY_A
		);

		return $row ?: array();
	}
}
