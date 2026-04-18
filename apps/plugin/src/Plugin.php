<?php
declare(strict_types=1);

namespace ChurnStop;

use ChurnStop\Admin\Admin;
use ChurnStop\Analytics\CohortLtv;
use ChurnStop\Branding\WhiteLabel;
use ChurnStop\Compliance\ClickToCancel;
use ChurnStop\Core\Container;
use ChurnStop\Experiments\AbTestManager;
use ChurnStop\Flow\FlowEngine;
use ChurnStop\License\LicenseManager;
use ChurnStop\Privacy\DataSubjectHandlers;
use ChurnStop\Rest\RestRoutes;
use ChurnStop\Subscriptions\CancellationInterceptor;
use ChurnStop\Winback\UnsubscribeHandler;
use ChurnStop\Winback\WinbackScheduler;
use ChurnStop\Winback\WinbackSender;

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
		$abTest     = new AbTestManager( $license );
		$cohortLtv  = new CohortLtv( $license );
		$flowEngine = new FlowEngine( $license, $abTest );
		$compliance = new ClickToCancel();

		$whiteLabel = new WhiteLabel( $license );

		// Register listeners.
		( new CancellationInterceptor( $flowEngine, $compliance ) )->register();
		( new Admin( $license, $flowEngine ) )->register();
		( new RestRoutes( $flowEngine, $license, $abTest, $cohortLtv, $whiteLabel ) )->register();
		( new DataSubjectHandlers() )->register();
		( new WinbackScheduler( $license ) )->register();
		( new WinbackSender( $license ) )->register();
		( new UnsubscribeHandler( $license ) )->register();
		$whiteLabel->register();

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
