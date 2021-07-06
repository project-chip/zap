const path = require('path')

const config = {
  mode: 'development',
  target: 'node',
  entry:
    path.resolve(__dirname, 'src-electron') + '/main-process/electron-main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' }],
  },
  devtool: 'source-map',
}

module.exports = config
