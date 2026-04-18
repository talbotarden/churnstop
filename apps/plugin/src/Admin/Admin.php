<?php
declare(strict_types=1);

namespace ChurnStop\Admin;

use ChurnStop\Flow\FlowEngine;
use ChurnStop\License\LicenseManager;

/**
 * Admin menu and page registration. Pages are React-rendered from the
 * assets/admin bundle; this class provides the HTML mount points.
 */
final class Admin {

	private LicenseManager $license;

	private FlowEngine $flowEngine;

	public function __construct( LicenseManager $license, FlowEngine $flowEngine ) {
		$this->license    = $license;
		$this->flowEngine = $flowEngine;
	}

	public function register(): void {
		add_action( 'admin_menu', array( $this, 'addMenu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueueAssets' ) );
		add_action( 'admin_init', array( $this, 'maybeRedirectOnActivation' ) );
	}

	public function addMenu(): void {
		add_menu_page(
			__( 'ChurnStop', 'churnstop' ),
			__( 'ChurnStop', 'churnstop' ),
			'manage_woocommerce',
			'churnstop',
			array( $this, 'renderDashboard' ),
			'dashicons-controls-pause',
			58
		);

		add_submenu_page( 'churnstop', __( 'Dashboard', 'churnstop' ), __( 'Dashboard', 'churnstop' ), 'manage_woocommerce', 'churnstop', array( $this, 'renderDashboard' ) );
		add_submenu_page( 'churnstop', __( 'Flows', 'churnstop' ), __( 'Flows', 'churnstop' ), 'manage_woocommerce', 'churnstop-flows', array( $this, 'renderMount' ) );
		add_submenu_page( 'churnstop', __( 'Offers', 'churnstop' ), __( 'Offers', 'churnstop' ), 'manage_woocommerce', 'churnstop-offers', array( $this, 'renderMount' ) );

		if ( $this->license->has( 'analytics' ) ) {
			add_submenu_page( 'churnstop', __( 'Analytics', 'churnstop' ), __( 'Analytics', 'churnstop' ), 'manage_woocommerce', 'churnstop-analytics', array( $this, 'renderMount' ) );
		}

		if ( $this->license->has( 'ab_testing' ) ) {
			add_submenu_page( 'churnstop', __( 'A/B Tests', 'churnstop' ), __( 'A/B Tests', 'churnstop' ), 'manage_woocommerce', 'churnstop-ab', array( $this, 'renderMount' ) );
		}

		if ( $this->license->has( 'winback' ) ) {
			add_submenu_page( 'churnstop', __( 'Winback', 'churnstop' ), __( 'Winback', 'churnstop' ), 'manage_woocommerce', 'churnstop-winback', array( $this, 'renderMount' ) );
		}

		add_submenu_page( 'churnstop', __( 'Logs', 'churnstop' ), __( 'Logs', 'churnstop' ), 'manage_woocommerce', 'churnstop-logs', array( $this, 'renderMount' ) );
		add_submenu_page( 'churnstop', __( 'Settings', 'churnstop' ), __( 'Settings', 'churnstop' ), 'manage_woocommerce', 'churnstop-settings', array( $this, 'renderMount' ) );
		add_submenu_page( 'churnstop', __( 'License', 'churnstop' ), __( 'License', 'churnstop' ), 'manage_options', 'churnstop-license', array( $this, 'renderMount' ) );
	}

	public function renderDashboard(): void {
		$this->renderMount();
	}

	public function renderMount(): void {
		echo '<div id="churnstop-app" class="wrap"></div>';
	}

	public function enqueueAssets( string $hook ): void {
		if ( ! str_contains( $hook, 'churnstop' ) ) {
			return;
		}

		$assetFile = CHURNSTOP_DIR . 'assets/admin/build/index.asset.php';

		if ( ! file_exists( $assetFile ) ) {
			return;
		}

		$asset = include $assetFile;

		wp_enqueue_script(
			'churnstop-admin',
			CHURNSTOP_URL . 'assets/admin/build/index.js',
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? CHURNSTOP_VERSION,
			true
		);

		wp_enqueue_style(
			'churnstop-admin',
			CHURNSTOP_URL . 'assets/admin/build/index.css',
			array( 'wp-components' ),
			$asset['version'] ?? CHURNSTOP_VERSION
		);

		wp_localize_script(
			'churnstop-admin',
			'ChurnStopAdmin',
			array(
				'apiUrl'       => rest_url( 'churnstop/v1/' ),
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'page'         => sanitize_key( (string) ( $_GET['page'] ?? 'churnstop' ) ),
				'entitlements' => get_option( LicenseManager::ENTITLEMENTS_OPTION, array() ),
			)
		);
	}

	public function maybeRedirectOnActivation(): void {
		if ( ! get_transient( 'churnstop_activation_redirect' ) ) {
			return;
		}

		delete_transient( 'churnstop_activation_redirect' );

		if ( wp_doing_ajax() || isset( $_GET['activate-multi'] ) ) {
			return;
		}

		wp_safe_redirect( admin_url( 'admin.php?page=churnstop' ) );
		exit;
	}
}
