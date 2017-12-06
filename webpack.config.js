const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const glob = require('glob')

module.exports = {
    entry: "./client/main.js",
    output: {
        path: __dirname + '/public',
        filename: "js/main.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: './html/index.html'
        }),
        new webpack.DefinePlugin({PRODUCTION: false}),
        // Generate a service worker script that will precache, and keep up to date,
        // the HTML & assets that are part of the Webpack build.
        new SWPrecacheWebpackPlugin({
            // By default, a cache-busting query parameter is appended to requests
            // used to populate the caches, to ensure the responses are fresh.
            // If a URL is already hashed by Webpack, then there is no concern
            // about it being stale, and the cache-busting can be skipped.
            dontCacheBustUrlsMatching: /\.\w{8}\./,
            filename: 'service-worker.js',
            logger(message) {
            if (message.indexOf('Total precache size is') === 0) {
                // This message occurs for every build and is a bit too noisy.
                return;
            }
            if (message.indexOf('Skipping static resource') === 0) {
                // This message obscures real errors so we ignore it.
                // https://github.com/facebookincubator/create-react-app/issues/2612
                return;
            }
            console.log(message);
            },
            minify: true,
            // For unknown URLs, fallback to the index page
            navigateFallback: 'index.html',
            // Ignores URLs starting from /__ (useful for Firebase):
            // https://github.com/facebookincubator/create-react-app/issues/2237#issuecomment-302693219
            navigateFallbackWhitelist: [/^(?!\/__).*/],
            // Don't precache sourcemaps (they're large) and build asset manifest:
            staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/],
            mergeStaticsConfig: true,
            staticFileGlobs: glob.sync('public/images/**/*.*').concat(glob.sync('public/sounds/**/*.*')),
            stripPrefix: 'public/',
        })
    ]
};