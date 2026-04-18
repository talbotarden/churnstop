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

		/**
		 * Fires when a subscriber clicks cancel and the save flow starts.
		 *
		 * @param int   $eventId        Cancellation event row id.
		 * @param int   $subscriptionId WC Subscriptions id.
		 * @param array $context        user_id, monthly_value_cents, platform, external_subscription_id.
		 */
		do_action(
			'churnstop_cancellation_started',
			$eventId,
			$subscriptionId,
			array(
				'user_id'                  => get_current_user_id(),
				'monthly_value_cents'      => $monthlyValue,
				'platform'                 => 'woocommerce',
				'external_subscription_id' => (string) $subscriptionId,
			)
		);

		$firstStep = $this->getFirstStep( (int) $flow['id'] );

		return array(
			'event_id' => $eventId,
			'step'     => $firstStep,
		);
	}

	/**
	 * True if the subscriber should bypass the save flow because they already
	 * saw one recently. 14 days by default; settable via Settings
	 * `rate_limit_days`. Zero disables the rate limit. The purpose is
	 * click-to-cancel compliance: if a customer came back to cancel again,
	 * showing them the same flow twice in quick succession looks like an
	 * obstruction to cancel.
	 */
	public function shouldSkipFlow( int $subscriptionId ): bool {
		$windowDays = (int) Settings::get( 'rate_limit_days', 14 );

		if ( $windowDays <= 0 ) {
			return false;
		}

		global $wpdb;

		$cutoff = gmdate( 'Y-m-d H:i:s', time() - ( $windowDays * DAY_IN_SECONDS ) );

		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}churnstop_cancellation_events
				 WHERE subscription_id = %d
				   AND created_at >= %s",
				$subscriptionId,
				$cutoff
			)
		);

		return $count > 0;
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

		/**
		 * Fires after the customer selects a cancellation reason.
		 *
		 * @param int    $eventId  Cancellation event row id.
		 * @param string $reason   Reason id from settings.
		 * @param string $freeText Optional open-text follow-up.
		 */
		do_action( 'churnstop_survey_submitted', $eventId, $reason, $freeText );

		$event     = $this->getEvent( $eventId );
		$offerStep = $this->getOfferStep( (int) $event['flow_id'] );

		if ( $offerStep === null ) {
			return $this->declineAndCancel( $eventId );
		}

		$config = json_decode( $offerStep['config_json'], true );
		$offer  = $config['conditional'][ $reason ] ?? $config['default_offer'] ?? null;

		/**
		 * Swap the offer for a specific reason. Runs after the default routing
		 * has picked an offer; return a modified offer array (or the same) to
		 * override. Useful for per-segment offers (e.g. VIPs get a bigger
		 * discount, beta users get an extended trial).
		 *
		 * @param array|null $offer   Offer array (type, value, duration_*, etc.) or null.
		 * @param string     $reason  Reason id.
		 * @param array      $context event_id, user_id, subscription_id.
		 */
		$offer = apply_filters(
			'churnstop_offer_for_reason',
			$offer,
			$reason,
			array(
				'event_id'        => $eventId,
				'user_id'         => (int) $event['user_id'],
				'subscription_id' => (int) $event['subscription_id'],
			)
		);

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

		$applied = false;

		switch ( $offer['type'] ) {
			case 'discount':
				$this->applyDiscount( $subscription, $offer );
				$applied = true;
				break;
			case 'pause':
				$this->applyPause( $subscription, $offer );
				$applied = true;
				break;
			case 'skip_renewal':
				$this->skipNextRenewal( $subscription );
				$applied = true;
				break;
			case 'tier_down':
				$applied = $this->applyTierDown( $subscription, $offer );
				break;
			case 'extend_trial':
				$applied = $this->applyExtendTrial( $subscription, $offer );
				break;
			case 'product_swap':
				$applied = $this->applyProductSwap( $subscription, $offer );
				break;
			default:
				// Unknown offer type; decline safely.
				return $this->declineAndCancel( $eventId );
		}

		if ( ! $applied ) {
			// Executor refused (e.g. extend_trial called after trial ended, tier_down
			// with no configured target product). Fall through to cancel so the
			// customer is not stuck in limbo.
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

		/**
		 * Fires when a save offer is accepted and successfully applied.
		 *
		 * @param int   $eventId Cancellation event row id.
		 * @param array $offer   Applied offer payload (type, value, duration_*).
		 */
		do_action( 'churnstop_offer_accepted', $eventId, $offer );

		/**
		 * Fires when a cancellation event reaches a terminal state (saved or
		 * cancelled). This is the hook to bind for pushing events into external
		 * analytics pipelines; it gives the full lifecycle record in one place.
		 *
		 * @param int   $eventId Cancellation event row id.
		 * @param array $event   Full event row after resolution.
		 */
		do_action( 'churnstop_cancellation_resolved', $eventId, $this->getEvent( $eventId ) );

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

		/**
		 * Fires on cancellation resolution. Same hook as acceptOffer; both
		 * terminal paths signal here so downstream analytics only bind once.
		 *
		 * @param int   $eventId Cancellation event row id.
		 * @param array $event   Full event row after resolution.
		 */
		do_action( 'churnstop_cancellation_resolved', $eventId, $this->getEvent( $eventId ) );

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
	 * Switch the subscription to a cheaper product in the same subscription group.
	 * Uses WC Subs Switcher API. Requires `target_product_id` in the offer payload.
	 * Returns false (so the caller falls through to cancel) if the target is not
	 * configured or the switch is not permitted.
	 *
	 * @platform-adapter woocommerce - Phase 2 will mirror this via apps/api/adapters/woocommerce.ts if we move flow execution server-side.
	 *
	 * @param array<string, mixed> $offer
	 */
	// PLATFORM_ADAPTER: tier-down uses WC_Subscriptions_Switcher in Phase 1.
	private function applyTierDown( \WC_Subscription $subscription, array $offer ): bool {
		$targetId = (int) ( $offer['target_product_id'] ?? 0 );

		if ( $targetId <= 0 || ! class_exists( '\WC_Subscriptions_Switcher' ) ) {
			return false;
		}

		return $this->switchToProduct( $subscription, $targetId, 'tier_down' );
	}

	/**
	 * Extend the trial period by N days. Only meaningful while the subscription
	 * is still in its trial; returns false if the trial has already ended so
	 * the caller can fall through to cancel.
	 *
	 * @platform-adapter woocommerce - Phase 2 will mirror this via apps/api/adapters/woocommerce.ts if we move flow execution server-side.
	 *
	 * @param array<string, mixed> $offer
	 */
	// PLATFORM_ADAPTER: trial extension uses WC Subs date helpers in Phase 1.
	private function applyExtendTrial( \WC_Subscription $subscription, array $offer ): bool {
		$trialEnd = $subscription->get_date( 'trial_end' );

		if ( empty( $trialEnd ) || strtotime( $trialEnd ) < time() ) {
			return false;
		}

		$days = max( 1, (int) ( $offer['duration_days'] ?? 14 ) );
		$next = strtotime( "+{$days} days", strtotime( $trialEnd ) );

		if ( ! $next ) {
			return false;
		}

		$subscription->update_dates(
			array(
				'trial_end'    => gmdate( 'Y-m-d H:i:s', $next ),
				'next_payment' => gmdate( 'Y-m-d H:i:s', $next ),
			)
		);

		return true;
	}

	/**
	 * Switch to a different subscription product at the same or different price
	 * point. Same mechanic as tier_down but framed as a product swap rather than
	 * a downgrade. Requires `target_product_id`.
	 *
	 * @platform-adapter woocommerce - Phase 2 will mirror this via apps/api/adapters/woocommerce.ts if we move flow execution server-side.
	 *
	 * @param array<string, mixed> $offer
	 */
	// PLATFORM_ADAPTER: product swap uses WC_Subscriptions_Switcher in Phase 1.
	private function applyProductSwap( \WC_Subscription $subscription, array $offer ): bool {
		$targetId = (int) ( $offer['target_product_id'] ?? 0 );

		if ( $targetId <= 0 || ! class_exists( '\WC_Subscriptions_Switcher' ) ) {
			return false;
		}

		return $this->switchToProduct( $subscription, $targetId, 'product_swap' );
	}

	/**
	 * Shared helper for tier_down and product_swap. Replaces the single line
	 * item on the subscription with the target product's price + line, records
	 * a note, and leaves status unchanged. If the subscription has multiple
	 * line items we refuse to switch - that is an ambiguous case that should
	 * surface as a real decline rather than guessing.
	 */
	private function switchToProduct( \WC_Subscription $subscription, int $targetId, string $reason ): bool {
		$target = wc_get_product( $targetId );

		if ( ! $target ) {
			return false;
		}

		$items = $subscription->get_items();

		if ( count( $items ) !== 1 ) {
			return false;
		}

		$itemId = array_key_first( $items );
		$item   = $items[ $itemId ];

		// Replace the product on the existing line item rather than removing and
		// re-adding, so user-facing line-item id + meta references (gift notes,
		// per-item attributes) stay intact where possible.
		$item->set_product( $target );
		$item->set_name( $target->get_name() );
		$item->set_subtotal( (float) $target->get_price() );
		$item->set_total( (float) $target->get_price() );
		$item->save();

		$subscription->calculate_totals();
		$subscription->save();

		$subscription->add_order_note(
			sprintf(
				/* translators: 1: product name, 2: reason slug */
				__( 'ChurnStop %2$s save: switched to %1$s.', 'churnstop' ),
				$target->get_name(),
				$reason
			)
		);

		return true;
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
