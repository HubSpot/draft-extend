import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

const globals = {
  'draft-js': 'Draft',
  'immutable': 'Immutable',
  'react': 'React',
  'react-dom': 'ReactDOM'
};

const bundle = (env) => ({
  input: 'esm/index.js',
  external: Object.keys(globals),
  output: {
    globals,
    file: env === 'production' ? 'dist/draft-extend.min.js' : 'dist/draft-extend.js' ,
    format: 'umd',
    name: 'DraftExtend',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    env === 'production' && terser(),
  ].filter(Boolean),
})

export default [bundle('production'), bundle('development')];