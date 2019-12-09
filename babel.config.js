module.exports = {
  env: {
    commonjs: {
      presets: ['@babel/env', '@babel/react'],
      plugins: ['@babel/transform-runtime'],
    },
    esm: {
      presets: [
        ['@babel/react', { useBuiltIns: true }]
      ]
    }
  }
};