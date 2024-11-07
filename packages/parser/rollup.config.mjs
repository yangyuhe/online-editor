// rollup.config.mjs
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import { fileURLToPath } from 'url';
// import typescript from '@rollup/plugin-typescript';
const distDir = fileURLToPath(new URL('./dist', import.meta.url));
export default [
  {
    input: './dist/web/index.js',
    plugins: [
      nodeResolve(),
      commonjs(),
      alias({
        entries: [{ find: '@', replacement: distDir }]
      })
    ],
    output: {
      file: './dist/web/bundle.js',
      format: 'es'
    },
    context: 'this'
  },
  {
    input: './dist/web/worker.js',
    plugins: [
      nodeResolve(),
      commonjs(),
      alias({
        entries: [{ find: '@', replacement: distDir }]
      })
    ],
    output: {
      file: './dist/web/worker-bundle.js',
      format: 'es'
    },
    context: 'this'
  },
  {
    input: './dist/sw/index.js',
    plugins: [
      nodeResolve(),
      commonjs(),
      alias({
        entries: [{ find: '@', replacement: distDir }]
      })
    ],
    output: {
      file: 'dist/sw/bundle.js',
      format: 'es'
    },
    context: 'this'
  }
];
