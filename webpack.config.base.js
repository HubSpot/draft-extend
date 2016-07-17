const webpack = require('webpack');

module.exports = {
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
      query: {
        presets: ['es2015', 'react'],
        plugins: ['transform-object-rest-spread']
      }
    }]
  },
  output: {
    library: 'DraftExtend',
    libraryTarget: 'umd'
  },
  externals: {
    'draft-js': 'Draft',
    'immutable': 'Immutable',
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
};
