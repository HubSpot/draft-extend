const webpack = require('webpack');

module.exports = {
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/
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
