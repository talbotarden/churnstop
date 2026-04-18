<?php
declare(strict_types=1);

namespace ChurnStop;

use ChurnStop\Admin\Admin;
use ChurnStop\Compliance\ClickToCancel;
use ChurnStop\Core\Container;
use ChurnStop\Flow\FlowEngine;
use ChurnStop\License\LicenseManager;
use ChurnStop\Rest\RestRoutes;
use ChurnStop\Subscriptions\CancellationInterceptor;

/**
 * Main plugin bootstrap. Singleton pattern; wires the subsystems together.
 */
final class Plugin {

	private static ?Plugin $instance = null;

	private Container $container;

	private bool $booted = false;

	public static function instance(): Plugin {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {
		$this->container = new Container();
	}

	public function boot(): void {
		if ( $this->booted ) {
			return;
		}

		// Core subsystems.
		$license    = new LicenseManager();
		$flowEngine = new FlowEngine( $license );
		$compliance = new ClickToCancel();

		// Register listeners.
		( new CancellationInterceptor( $flowEngine, $compliance ) )->register();
		( new Admin( $license, $flowEngine ) )->register();
		( new RestRoutes( $flowEngine ) )->register();

		// Load translations.
		add_action(
			'init',
			static function (): void {
				load_plugin_textdomain( 'churnstop', false, dirname( CHURNSTOP_BASENAME ) . '/languages' );
			}
		);

		$this->booted = true;
	}

	public function container(): Container {
		return $this->container;
	}
}
