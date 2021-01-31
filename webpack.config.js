const webpack = require('webpack');
const glob = require('glob')
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
    entry: "./client/main.js",
    output: {
        path: __dirname + '/public',
        filename: "js/main.js"
    },
    mode: (isProduction) ? 'production' : 'development',
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: './html/index.html',
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
            },
        }),
        new webpack.DefinePlugin({PRODUCTION: isProduction}),
        
    ]
};