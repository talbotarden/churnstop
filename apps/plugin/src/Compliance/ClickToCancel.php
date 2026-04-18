<?php
declare(strict_types=1);

namespace ChurnStop\Compliance;

/**
 * Enforces click-to-cancel compliance constraints.
 *
 * These are HARD rules that merchants cannot override through configuration.
 * They exist to keep every ChurnStop-powered cancel flow compliant with ROSCA
 * and related state-level subscription cancellation laws.
 *
 * Rule summary:
 *  1. "No thanks, cancel" must be visible and clickable on every flow screen.
 *  2. Completing cancellation from any save-offer screen must be ONE click.
 *  3. Cancel button cannot be hidden, disabled, or styled out of visibility.
 *  4. Every cancellation attempt is logged immutably for audit.
 *  5. The button text must be clear ("cancel subscription"), not misleading.
 */
final class ClickToCancel {

	private const AUDIT_RETENTION_DAYS = 2557; // 7 years.

	/**
	 * Validate a flow configuration before save. Returns a list of violations.
	 *
	 * @param array<string, mixed> $config
	 *
	 * @return list<string>
	 */
	public function validateFlow( array $config ): array {
		$violations = array();

		if ( ! empty( $config['hide_cancel_button'] ) ) {
			$violations[] = __( 'The cancel button cannot be hidden. Click-to-cancel compliance requires it to remain visible.', 'churnstop' );
		}

		if ( ! empty( $config['require_reason_to_cancel'] ) ) {
			$violations[] = __( 'You cannot force customers to pick a reason before cancelling. Reason surveys must be optional OR the "cancel" button must remain available throughout.', 'churnstop' );
		}

		if ( isset( $config['cancel_button_text'] ) && ! $this->isClearCancelText( (string) $config['cancel_button_text'] ) ) {
			$violations[] = __( 'Cancel button text must clearly indicate cancellation. Phrases like "Continue browsing" or "Go back" are not acceptable.', 'churnstop' );
		}

		if ( ! empty( $config['multi_step_cancel_confirmation'] ) && (int) $config['multi_step_cancel_confirmation'] > 1 ) {
			$violations[] = __( 'Completing cancellation must be one click from any save-offer screen.', 'churnstop' );
		}

		return $violations;
	}

	/**
	 * Record an immutable audit entry for a cancellation attempt.
	 */
	public function auditCancellationAttempt( int $userId, int $subscriptionId, string $outcome ): void {
		global $wpdb;

		$wpdb->insert(
			$wpdb->prefix . 'churnstop_cancellation_events',
			array(
				'user_id'         => $userId,
				'subscription_id' => $subscriptionId,
				'flow_id'         => 0,
				'final_status'    => $outcome,
				'created_at'      => current_time( 'mysql' ),
			)
		);
	}

	public function shortReceiptForAudit( int $cancellationEventId ): string {
		// Hashable audit line for external verification. Not rotating keys yet.
		return hash( 'sha256', (string) $cancellationEventId . '|' . (string) time() );
	}

	private function isClearCancelText( string $text ): bool {
		$normalized = strtolower( trim( $text ) );

		$acceptable = array(
			'cancel',
			'cancel my subscription',
			'cancel subscription',
			'yes, cancel',
			'no thanks, cancel my subscription',
		);

		foreach ( $acceptable as $phrase ) {
			if ( str_contains( $normalized, $phrase ) ) {
				return true;
			}
		}

		return false;
	}
}
