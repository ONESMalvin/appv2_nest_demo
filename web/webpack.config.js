const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    page1: './src/pages/page1.js',
    setting_page_1: './src/setting_page_1/index.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    //publicPath: 'http://localhost:8083/static/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/page1.html',
      filename: 'page1.html',
      chunks: ['page1']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/page2.html',
      filename: 'page2.html',
      chunks: ['setting_page_1']
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    hot: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      },
      '/install_cb': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/uninstall_cb': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/enabled_cb': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/disabled_cb': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/all_installations': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/manhour/validate': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/events/webhook': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/oauth/callback': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/settingPage/entries': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/manifest': {
        target: 'http://localhost:8083',
        changeOrigin: true
      }
    }
  }
};
