/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const ReactRefreshTypeScript = require('react-refresh-typescript')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const common = require('./webpack.common')
const { mergeWithRules } = require('webpack-merge')
const path = require('path')
const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default

const styledComponentsTransformer = createStyledComponentsTransformer()

process.env.NODE_ENV = 'development'

const host = process.env.HOST || 'localhost'

module.exports = mergeWithRules({
    module: {
        rules: {
            test: "match",
            use: {
                loader: "match",
                options: 'replace'
            },
        },
    },
})(common, {
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts$|tsx/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers: () => ({
                            before: [
                                styledComponentsTransformer,
                                ReactRefreshTypeScript()
                            ]
                        }),
                        transpileOnly: true,
                    }
                },
                exclude: /node_modules/,
            },
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        hot: true,
        host,
        port: 3000,
        historyApiFallback: true,
        client: {
            overlay: false,
        },
    },
    plugins: [
        new ReactRefreshWebpackPlugin({ overlay: false }),
    ]
})
