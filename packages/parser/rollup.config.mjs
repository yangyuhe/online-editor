// rollup.config.mjs

export default [
  {
    input: 'loader/index.js',
    output: {
      file: 'dist/bundle.js',
      format: 'es'
    }
  },
  {
    input: './sw.js',
    output: {
      file: 'dist/sw.js',
      format: 'es'
    }
  },
  {
    input: './bin/ws.js',
    output: {
      file: 'dist/startWatch.js',
      format: 'cjs'
    }
  }
];
