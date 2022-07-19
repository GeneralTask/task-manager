/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const SentryCliPlugin = require('@sentry/webpack-plugin');
const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default

const styledComponentsTransformer = createStyledComponentsTransformer()

module.exports = {
    entry: './src/index.tsx',
    module: {
        rules: [
            {
                test: /\.ts$|tsx/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers: () => ({
                            before: [
                                styledComponentsTransformer
                            ]
                        }),
                        transpileOnly: true,
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: "babel-loader",
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/react-toastify'),
                    path.resolve(__dirname, 'node_modules/animate.css'),
                ]
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'public', to: '' }
            ]
        }),
        new SentryCliPlugin({
            // Must be the last running plugin
            include: '.',
            ignoreFile: '.sentrycliignore',
            ignore: ['node_modules', 'webpack.dev.js', 'webpack.prod.js', 'webpack.common.js'],
            configFile: 'sentry.config.js',
        }),
    ],
}
