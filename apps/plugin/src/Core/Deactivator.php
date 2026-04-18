<?php
declare(strict_types=1);

namespace ChurnStop\Core;

/**
 * Runs on plugin deactivation. Clears scheduled events.
 * Data is preserved on deactivation; cleanup only happens on uninstall.
 */
final class Deactivator
{
    public static function deactivate(): void
    {
        wp_clear_scheduled_hook('churnstop_license_refresh');
        wp_clear_scheduled_hook('churnstop_winback_tick');
    }
}
