<?php
declare(strict_types=1);

namespace ChurnStop\Core;

/**
 * Minimal dependency container. Holds lazily-resolved service instances.
 */
final class Container {

	/** @var array<string, callable> */
	private array $factories = array();

	/** @var array<string, object> */
	private array $instances = array();

	public function set( string $id, callable $factory ): void {
		$this->factories[ $id ] = $factory;
		unset( $this->instances[ $id ] );
	}

	public function get( string $id ): object {
		if ( isset( $this->instances[ $id ] ) ) {
			return $this->instances[ $id ];
		}

		if ( ! isset( $this->factories[ $id ] ) ) {
			throw new \RuntimeException( sprintf( 'Service "%s" not registered.', $id ) );
		}

		return $this->instances[ $id ] = ( $this->factories[ $id ] )( $this );
	}

	public function has( string $id ): bool {
		return isset( $this->factories[ $id ] ) || isset( $this->instances[ $id ] );
	}
}
