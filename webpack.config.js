const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const glob = require('glob')

module.exports = {
    entry: "./client/main.js",
    output: {
        path: __dirname + '/public',
        filename: "js/main.js"
    }
};