/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const webpack = require('webpack')

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
                            before: [styledComponentsTransformer],
                        }),
                        transpileOnly: true,
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/react-toastify'),
                    path.resolve(__dirname, 'node_modules/animate.css'),
                    path.resolve(__dirname, 'node_modules/@remirror'),
                    path.resolve(__dirname, 'node_modules/@atlaskit/css-reset'),
                    path.resolve(__dirname, 'node_modules/react-loading-skeleton'),
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            buffer: require.resolve('buffer/'),
            assert: require.resolve('assert/'),
        },
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: 'public', to: '' }],
        }),
        new ForkTsCheckerWebpackPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_DEBUG': false,
        }),
    ],
    ignoreWarnings: [
        {
            module: /@atlaskit/,
        },
    ],
}
