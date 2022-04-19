/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default;
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const styledComponentsTransformer = createStyledComponentsTransformer();
const host = process.env.HOST || 'localhost';

// Required for babel-preset-react-app
process.env.NODE_ENV = 'development';

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
                                styledComponentsTransformer,
                                process.env.NODE_ENV === 'development' && ReactRefreshTypeScript(),
                            ].filter(Boolean)
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
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
                exclude: /node_modules/,
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
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'public', to: '' }
            ]
        }),
    ]
        // dev plugins
        .concat(process.env.NODE_ENV !== 'development' ? [] : [
            new ReactRefreshWebpackPlugin({ overlay: false }),
            new ForkTsCheckerWebpackPlugin(),
        ])
};
