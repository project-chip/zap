const path = require('path')

const nodeExternals = require('webpack-node-externals')

const config = {
  node: {
    __dirname: true,
    __filename: true,
  },
  mode: 'development',
  target: 'electron-main',
  entry:
    path.resolve(__dirname, 'src-electron') + '/main-process/electron-main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'electron-main.js',
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        options: {
          formatter: require('eslint').CLIEngine.getFormatter('stylish'),
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
      {
        enforce: 'pre',
        test: /\.(sql)$/,
        loader: 'file-loader',
        exclude: /node_modules/,
        options: {
          name: '[path][name].[ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'source-map',
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
}

module.exports = config
