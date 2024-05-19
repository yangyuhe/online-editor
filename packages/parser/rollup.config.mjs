// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';

export default [
  // {
  //   input: 'loader/index.ts',
  //   output: {
  //     file: 'dist/bundle.js',
  //     format: 'es'
  //   }
  // },
  // {
  //   input: './sw.js',
  //   output: {
  //     file: 'dist/sw.js',
  //     format: 'es'
  //   }
  // },
  {
    input: './bin/listFiles.ts',
    plugins: [typescript()],
    output: {
      file: 'dist/listFiles.js',
      format: 'cjs'
    }
  }
];
