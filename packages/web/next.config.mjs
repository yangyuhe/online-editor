/** @type {import('next').NextConfig} */
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

/**拷贝sw.js文件 */
const require = createRequire(import.meta.url);
const swPath = require.resolve('@online-editor/parser/dist/sw.js');
const publicSwPath = path.resolve(__dirname, 'public/sw.js');
fs.copyFileSync(swPath, publicSwPath);

const nextConfig = {
  //防止开发阶段组件被渲染两次
  reactStrictMode: false,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Important: return the modified config
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          // available options are documented at https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md#options
          languages: ['json', 'javascript', 'typescript'],
          filename: 'static/[name].worker.js'
        })
      );
    }
    return config;
  }
};

export default nextConfig;
