<?php
declare(strict_types=1);

namespace ChurnStop\Winback;

/**
 * Definition of the default 3-step winback email sequence. Timings and
 * copy are filterable so merchants can override via their theme or a
 * child plugin without touching ChurnStop source. Merge tags are
 * resolved at send time from the cancellation event + customer data.
 */
final class WinbackSequence {

	public const DEFAULT_STEPS = array(
		array(
			'step'         => 1,
			'delay_days'   => 7,
			'subject'      => 'We noticed you left, {{first_name}}',
			'body'         => "Hi {{first_name}},\n\nYou cancelled {{site_name}} a week ago. If there is anything we could have done differently, we would love to hear it - just reply to this email.\n\nIf you want to give it another try, your seat is waiting: {{resubscribe_url}}\n\nThanks,\nThe {{site_name}} team\n\n{{unsubscribe_line}}",
		),
		array(
			'step'         => 2,
			'delay_days'   => 21,
			'subject'      => 'Come back for 30% off your first month',
			'body'         => "Hi {{first_name}},\n\nThree weeks away from {{site_name}}. We hope things are going well.\n\nIf you want to come back, here is 30% off your first month: {{resubscribe_url}}?winback=30\n\nNo pressure. This offer is valid for 7 days.\n\n- The {{site_name}} team\n\n{{unsubscribe_line}}",
		),
		array(
			'step'         => 3,
			'delay_days'   => 60,
			'subject'      => 'One last check-in',
			'body'         => "Hi {{first_name}},\n\nIt has been two months. We will not keep emailing after this; this is the last winback message.\n\nIf the door is still open, we would love to have you back: {{resubscribe_url}}\n\nOtherwise, all the best.\n\n- The {{site_name}} team\n\n{{unsubscribe_line}}",
		),
	);

	/**
	 * @return array<int, array{step: int, delay_days: int, subject: string, body: string}>
	 */
	public static function steps(): array {
		/**
		 * Override the default winback sequence. Return an array of step
		 * definitions; each needs step, delay_days, subject, and body.
		 *
		 * @param array $steps Default sequence.
		 */
		$steps = apply_filters( 'churnstop_winback_sequence', self::DEFAULT_STEPS );

		if ( ! is_array( $steps ) ) {
			return self::DEFAULT_STEPS;
		}

		$clean = array();
		foreach ( $steps as $step ) {
			if ( ! is_array( $step ) ) {
				continue;
			}
			$clean[] = array(
				'step'       => (int) ( $step['step'] ?? ( count( $clean ) + 1 ) ),
				'delay_days' => max( 1, (int) ( $step['delay_days'] ?? 7 ) ),
				'subject'    => (string) ( $step['subject'] ?? '' ),
				'body'       => (string) ( $step['body'] ?? '' ),
			);
		}

		return $clean;
	}

	/**
	 * Resolve merge tags in a subject or body. Unknown tags are left in
	 * place so merchants notice and fix typos rather than silently
	 * sending emails with literal {{placeholders}} stripped out.
	 *
	 * @param array<string, string> $context
	 */
	public static function render( string $template, array $context ): string {
		return preg_replace_callback(
			'/\{\{([a-z_]+)\}\}/',
			static function ( array $match ) use ( $context ): string {
				$key = $match[1];
				return $context[ $key ] ?? $match[0];
			},
			$template
		) ?? $template;
	}
}
