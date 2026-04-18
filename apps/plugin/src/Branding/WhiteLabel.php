<?php
declare(strict_types=1);

namespace ChurnStop\Branding;

use ChurnStop\License\LicenseManager;

/**
 * White-label branding for agencies who resell ChurnStop under their own
 * brand. When an agency license is active, the admin UI substitutes the
 * configured plugin name + logo in menu labels, page headings, and footer
 * credits. Customer-facing surfaces (the cancellation modal) are NOT
 * rebranded here - modal copy is already fully merchant-configurable.
 *
 * All branding reads from options keyed under `churnstop_branding`; the
 * admin settings screen writes them via the existing Settings REST
 * endpoint but this class is the single place that applies them.
 *
 * License-gated: requires the `white_label` entitlement (Agency only).
 * With no license the methods are a no-op so uninstalling the Agency
 * license cleanly reverts the admin to the default ChurnStop brand.
 */
final class WhiteLabel {

	public const FEATURE      = 'white_label';
	public const OPTION_KEY   = 'churnstop_branding';

	private LicenseManager $license;

	public function __construct( LicenseManager $license ) {
		$this->license = $license;
	}

	public function register(): void {
		if ( ! $this->isEnabled() ) {
			return;
		}

		add_filter( 'admin_title', array( $this, 'filterAdminTitle' ), 20, 2 );
		add_filter( 'admin_footer_text', array( $this, 'filterAdminFooter' ), 20 );
		add_action( 'admin_menu', array( $this, 'relabelMenu' ), 999 );
		add_action( 'admin_head', array( $this, 'injectBrandStyles' ) );
	}

	public function isEnabled(): bool {
		return $this->license->has( self::FEATURE );
	}

	/**
	 * @return array{
	 *   product_name: string,
	 *   company_name: string,
	 *   logo_url: string,
	 *   accent_color: string,
	 *   support_email: string,
	 *   hide_ab_tests: bool,
	 *   footer_credit: string,
	 * }
	 */
	public function branding(): array {
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		$defaults = array(
			'product_name'  => 'ChurnStop',
			'company_name'  => '',
			'logo_url'      => '',
			'accent_color'  => '',
			'support_email' => '',
			'hide_ab_tests' => false,
			'footer_credit' => '',
		);

		return array_replace( $defaults, array_intersect_key( $stored, $defaults ) );
	}

	public function save( array $incoming ): array {
		$sanitised = array(
			'product_name'  => isset( $incoming['product_name'] ) ? sanitize_text_field( (string) $incoming['product_name'] ) : 'ChurnStop',
			'company_name'  => isset( $incoming['company_name'] ) ? sanitize_text_field( (string) $incoming['company_name'] ) : '',
			'logo_url'      => isset( $incoming['logo_url'] ) ? esc_url_raw( (string) $incoming['logo_url'] ) : '',
			'accent_color'  => isset( $incoming['accent_color'] ) ? (string) sanitize_hex_color( (string) $incoming['accent_color'] ) : '',
			'support_email' => isset( $incoming['support_email'] ) ? sanitize_email( (string) $incoming['support_email'] ) : '',
			'hide_ab_tests' => ! empty( $incoming['hide_ab_tests'] ),
			'footer_credit' => isset( $incoming['footer_credit'] ) ? wp_kses_post( (string) $incoming['footer_credit'] ) : '',
		);

		update_option( self::OPTION_KEY, $sanitised );

		return $sanitised;
	}

	public function filterAdminTitle( string $adminTitle, string $title ): string {
		$name = $this->productName();
		if ( $name === 'ChurnStop' ) {
			return $adminTitle;
		}
		return str_replace( 'ChurnStop', $name, $adminTitle );
	}

	public function filterAdminFooter( $text ): string {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || strpos( (string) $screen->id, 'churnstop' ) === false ) {
			return (string) $text;
		}

		$credit = $this->branding()['footer_credit'];
		if ( $credit !== '' ) {
			return wp_kses_post( $credit );
		}

		return (string) $text;
	}

	/**
	 * Relabel the menu + submenu items so every visible string says the
	 * rebranded product name. Admin.php wires the menu with
	 * 'ChurnStop' literals so we do a targeted find-and-replace after
	 * registration; this keeps the two concerns isolated.
	 */
	public function relabelMenu(): void {
		// Relabeling the WP menu requires writing back to the globals WP
		// builds the admin chrome from. This is the documented pattern
		// for admin_menu plugins; the global-override sniff is a false
		// positive in this context.
		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
		global $menu, $submenu;

		$name = $this->productName();
		$hide = (bool) $this->branding()['hide_ab_tests'];

		if ( is_array( $menu ) ) {
			foreach ( $menu as $idx => $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}
				if ( isset( $item[2] ) && $item[2] === 'churnstop' ) {
					$menu[ $idx ][0] = esc_html( $name );
					$menu[ $idx ][3] = esc_html( $name );
				}
			}
		}

		if ( isset( $submenu['churnstop'] ) && is_array( $submenu['churnstop'] ) ) {
			foreach ( $submenu['churnstop'] as $idx => $sub ) {
				if ( ! is_array( $sub ) ) {
					continue;
				}
				if ( isset( $sub[2] ) && $sub[2] === 'churnstop' && isset( $sub[0] ) ) {
					$submenu['churnstop'][ $idx ][0] = esc_html__( 'Dashboard', 'churnstop' );
				}
				if ( $hide && isset( $sub[2] ) && $sub[2] === 'churnstop-ab' ) {
					unset( $submenu['churnstop'][ $idx ] );
				}
			}
		}
		// phpcs:enable WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * Inject a tiny stylesheet so the accent color bleeds into buttons
	 * and the logo (when configured) renders on top of the page title.
	 */
	public function injectBrandStyles(): void {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || strpos( (string) $screen->id, 'churnstop' ) === false ) {
			return;
		}

		$branding = $this->branding();
		$accent   = $branding['accent_color'];
		$logo     = $branding['logo_url'];

		$css = '';
		if ( $accent !== '' ) {
			$css .= sprintf( ':root{--churnstop-accent:%s;}', esc_attr( $accent ) );
			$css .= sprintf( '.cs-badge-running,.button-primary.churnstop{background:%1$s;border-color:%1$s;}', esc_attr( $accent ) );
		}
		if ( $logo !== '' ) {
			$css .= sprintf(
				'#wpbody-content .wrap h1:first-of-type::before{content:"";display:inline-block;background:url(%s) center/contain no-repeat;width:28px;height:28px;vertical-align:middle;margin-right:8px;}',
				esc_url( $logo )
			);
		}

		if ( $css !== '' ) {
			echo '<style id="churnstop-branding">' . $css . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
	}

	public function productName(): string {
		return $this->branding()['product_name'] ?: 'ChurnStop';
	}
}
