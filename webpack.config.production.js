const webpack = require('webpack');
const glob = require('glob')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: "./client/main.js",
    output: {
        path: __dirname + '/public',
        filename: "js/main.js"
    },
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
        new webpack.DefinePlugin({PRODUCTION: true}),
        
    ]
};