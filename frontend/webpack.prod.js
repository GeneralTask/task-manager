/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

process.env.NODE_ENV = 'development'

module.exports = merge(common, {
    mode: 'production',
})
