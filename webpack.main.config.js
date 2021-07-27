const path = require('path')
const nodeExternals = require('webpack-node-externals')
const CopyPlugin = require('copy-webpack-plugin')

const config = {
  node: {
    __dirname: false,
    __filename: true,
  },
  mode: 'production',
  target: 'electron-main',
  context: path.resolve(__dirname + '/src-electron/main-process/'),
  entry: './electron-main',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'electron-main.js',
  },
  module: {
    noParse: /\/native-require.js$/,
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'eslint-loader',
            options: {
              formatter: require('eslint').CLIEngine.getFormatter('stylish'),
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                noEmit: false,
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        enforce: 'pre',
        test: /\.sql$/,
        loader: 'file-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'source-map',
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: '../db/zap-schema.sql', to: 'backend/db/' },
        { from: '../../zcl-builtin', to: 'backend/zcl-builtin' },
        { from: '../icons', to: 'backend/icons' },
      ],
    }),
  ],
}

module.exports = config
