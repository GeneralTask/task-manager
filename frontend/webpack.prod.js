/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const SentryCliPlugin = require('@sentry/webpack-plugin')

process.env.NODE_ENV = 'production'

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    plugins: [
        new SentryCliPlugin({
            // Must be the last running plugin
            include: '.',
            ignore: ['node_modules', 'webpack.dev.js', 'webpack.prod.js', 'webpack.common.js'],
        }),
    ],
})
