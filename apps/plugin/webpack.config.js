/**
 * Webpack config consumed by @wordpress/scripts. Extends the default WP-Scripts
 * config and overrides the entry map + output filenames so Admin.php can load
 * `admin/build/index.js` and `modal/build/modal.js` by their simple names
 * rather than the wp-scripts default of `<basename-with-ext>.js`.
 *
 * Both entries get independent .asset.php files (emitted by WP-Scripts'
 * DependencyExtractionWebpackPlugin) listing their @wordpress/* dependencies.
 */

const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
  ...defaultConfig,
  entry: {
    'admin/build/index': path.resolve(__dirname, 'assets/admin/src/index.tsx'),
    'modal/build/modal': path.resolve(__dirname, 'assets/modal/src/modal.tsx'),
  },
  output: {
    ...defaultConfig.output,
    path: path.resolve(__dirname, 'assets'),
    filename: '[name].js',
    // IMPORTANT: disable output.clean. WP-Scripts default is clean={keep:/^(fonts|images)\//},
    // which would wipe assets/admin/src and assets/modal/src because they do not match
    // the keep regex. We set output.path to `assets/` because the entry keys already
    // encode the `admin/build/` and `modal/build/` sub-paths; the tradeoff is that
    // stale build artifacts aren't auto-removed on rebuild. The `pnpm clean` helper
    // (or `rm -rf assets/{admin,modal}/build` before a build) handles that case.
    clean: false,
  },
};
