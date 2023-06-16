const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const minimist = require('minimist');

const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const commandsConfigs = minimist(process.argv.slice(2));
const isProd = commandsConfigs.mode === 'production';

const devEntry = {
  dev: isProd ? undefined : 'webpack-dev-server/client?http://localhost:8080',
  main: './app/index.js',
  error_handler: './app/error-handler.js',
  promise: './vendor/promise.js',
  style: './app/styles/base.css',
};

const prodEntry = {
  main: './app/index.js',
  error_handler: './app/error-handler.js',
  promise: './vendor/promise.js',
  style: './app/styles/base.css',
};

module.exports = {
  devtool: isProd ? 'none' : 'inline-cheap-module-source-map',
  devServer: isProd
    ? undefined
    : {
        compress: false,
        publicPath: 'dist/',
        historyApiFallback: true,
        clientLogLevel: 'info',
        open: true,
        writeToDisk: true,
        overlay: {
          warnings: true,
          errors: true,
        },
      },
  node: {
    fs: 'empty',
  },

  mode: isProd ? 'production' : 'development',
  entry: isProd ? prodEntry : devEntry,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.[hash].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
          },
          // {
          //     loader: "postcss-loader"
          // },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
            },
          },
        ],
      },
      {
        // Now we apply rule for images
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            // Using file-loader for these files
            loader: 'file-loader',

            // In options we can set different things like format
            // and directory to save
            options: {
              outputPath: 'images',
            },
          },
        ],
      },
      {
        // Apply rule for fonts files
        test: /\.(woff|woff2|ttf|otf|eot)$/,
        use: [
          {
            // Using file-loader too
            loader: 'file-loader',
            options: {
              outputPath: 'fonts',
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new CssMinimizerPlugin()],
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new Dotenv(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: '../index.html',
      template: 'vnc.html',
      minify: {
        html5: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: false,
        minifyURLs: false,
        removeAttributeQuotes: true,
        removeComments: true, // false for Vue SSR to find app placeholder
        removeEmptyAttributes: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributese: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackInlineSVGPlugin({
      inlineAll: true,
      runPreEmit: true,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].bundle.[hash].css',
    }),
  ],
};
