const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    setting_page_1: './src/setting_page_1/index.jsx',
    account_login: './src/login/account_login.jsx',
    web_sdk_demo: './src/web_sdk_demo/index.jsx',
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
      template: './src/pages/login.html',
      filename: 'login.html',
      chunks: ['account_login']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/setting_page_1.html',
      filename: 'setting_page_1.html',
      chunks: ['setting_page_1']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/web_sdk_demo.html',
      filename: 'web_sdk_demo.html',
      chunks: ['web_sdk_demo']
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
