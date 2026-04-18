<?php
declare(strict_types=1);

namespace ChurnStop\Subscriptions;

use ChurnStop\Compliance\ClickToCancel;
use ChurnStop\Core\Settings;
use ChurnStop\Flow\FlowEngine;

/**
 * Intercepts the WooCommerce Subscriptions cancellation path and routes through
 * the ChurnStop flow when a suitable flow is active.
 *
 * We do NOT block native cancellation. If the user chooses "No thanks, cancel,"
 * the native WC Subs flow proceeds unmodified.
 */
final class CancellationInterceptor
{
    private FlowEngine $flowEngine;

    private ClickToCancel $compliance;

    public function __construct(FlowEngine $flowEngine, ClickToCancel $compliance)
    {
        $this->flowEngine = $flowEngine;
        $this->compliance = $compliance;
    }

    public function register(): void
    {
        // Enqueue the save-flow modal on My Account subscription pages.
        add_action('wp_enqueue_scripts', [$this, 'enqueueModal']);

        // Add data-attributes to the native WC Subs cancel link so our JS can find it.
        add_filter('woocommerce_my_account_my_subscriptions_actions', [$this, 'markCancelAction'], 10, 2);

        // AJAX endpoint to kick off a flow.
        add_action('wp_ajax_churnstop_start_flow', [$this, 'ajaxStartFlow']);

        // AJAX endpoint to submit survey response.
        add_action('wp_ajax_churnstop_submit_survey', [$this, 'ajaxSubmitSurvey']);

        // AJAX endpoint to accept an offer.
        add_action('wp_ajax_churnstop_accept_offer', [$this, 'ajaxAcceptOffer']);

        // AJAX endpoint to decline and complete cancellation.
        add_action('wp_ajax_churnstop_decline_and_cancel', [$this, 'ajaxDeclineAndCancel']);
    }

    public function enqueueModal(): void
    {
        if (!is_account_page()) {
            return;
        }

        $asset = CHURNSTOP_DIR . 'assets/modal/build/modal.asset.php';
        $deps = ['wp-element'];
        $version = CHURNSTOP_VERSION;

        if (file_exists($asset)) {
            $data = include $asset;
            $deps = $data['dependencies'] ?? $deps;
            $version = $data['version'] ?? $version;
        }

        wp_enqueue_script(
            'churnstop-modal',
            CHURNSTOP_URL . 'assets/modal/build/modal.js',
            $deps,
            $version,
            true
        );

        // CSS is imported by the modal entry and emitted alongside the JS bundle.
        if (file_exists(CHURNSTOP_DIR . 'assets/modal/build/modal.css')) {
            wp_enqueue_style(
                'churnstop-modal',
                CHURNSTOP_URL . 'assets/modal/build/modal.css',
                [],
                $version
            );
        }

        $settings = Settings::all();

        wp_localize_script('churnstop-modal', 'ChurnStop', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('churnstop_flow'),
            'i18n' => [
                'noThanksCancel' => (string) ($settings['cancel_button_text'] ?? __('No thanks, cancel my subscription', 'churnstop')),
                'modalHeading' => (string) ($settings['modal_heading'] ?? __('Before you go...', 'churnstop')),
            ],
            'branding' => [
                'accentColor' => (string) ($settings['accent_color'] ?? '#0f1419'),
            ],
        ]);
    }

    /**
     * @param array<string, array<string, string>> $actions
     *
     * @return array<string, array<string, string>>
     */
    public function markCancelAction(array $actions, \WC_Subscription $subscription): array
    {
        if (isset($actions['cancel'])) {
            $actions['cancel']['class'] = trim(($actions['cancel']['class'] ?? '') . ' churnstop-cancel-intercept');
            $actions['cancel']['data-subscription-id'] = (string) $subscription->get_id();
        }

        return $actions;
    }

    public function ajaxStartFlow(): void
    {
        check_ajax_referer('churnstop_flow', 'nonce');

        $subscriptionId = isset($_POST['subscription_id']) ? (int) $_POST['subscription_id'] : 0;

        if ($subscriptionId <= 0) {
            wp_send_json_error(['message' => 'Invalid subscription'], 400);
        }

        if (!$this->currentUserOwnsSubscription($subscriptionId)) {
            wp_send_json_error(['message' => 'Unauthorised'], 403);
        }

        $payload = $this->flowEngine->startForSubscription($subscriptionId);

        wp_send_json_success($payload);
    }

    public function ajaxSubmitSurvey(): void
    {
        check_ajax_referer('churnstop_flow', 'nonce');
        $eventId = isset($_POST['event_id']) ? (int) $_POST['event_id'] : 0;
        $reason = isset($_POST['reason']) ? sanitize_key((string) $_POST['reason']) : '';
        $freeText = isset($_POST['free_text']) ? sanitize_textarea_field((string) $_POST['free_text']) : '';

        $payload = $this->flowEngine->submitSurvey($eventId, $reason, $freeText);
        wp_send_json_success($payload);
    }

    public function ajaxAcceptOffer(): void
    {
        check_ajax_referer('churnstop_flow', 'nonce');
        $eventId = isset($_POST['event_id']) ? (int) $_POST['event_id'] : 0;

        $result = $this->flowEngine->acceptOffer($eventId);
        wp_send_json_success($result);
    }

    public function ajaxDeclineAndCancel(): void
    {
        check_ajax_referer('churnstop_flow', 'nonce');
        $eventId = isset($_POST['event_id']) ? (int) $_POST['event_id'] : 0;

        $result = $this->flowEngine->declineAndCancel($eventId);
        wp_send_json_success($result);
    }

    private function currentUserOwnsSubscription(int $subscriptionId): bool
    {
        if (!function_exists('wcs_get_subscription')) {
            return false;
        }

        $subscription = wcs_get_subscription($subscriptionId);

        return $subscription && (int) $subscription->get_user_id() === get_current_user_id();
    }
}
