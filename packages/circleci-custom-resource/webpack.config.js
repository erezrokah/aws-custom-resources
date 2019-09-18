/* eslint-disable */

const path = require('path');
const slsw = require('serverless-webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  performance: {
    // Turn off size warnings for entry points
    hints: false,
  },
  optimization: {
    // We no not want to minimize our code.
    minimize: false,
  },
  node: {
    __dirname: true,
  },
  devtool: 'nosources-source-map',
  resolve: {
    extensions: ['.js', '.json', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.mjs$/,
        type: 'javascript/auto',
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    sourceMapFilename: '[file].map',
  },
  plugins: [
    new CopyPlugin([{ from: 'src/schema.json', to: 'src/schema.json' }]),
  ],
};
