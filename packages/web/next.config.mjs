/** @type {import('next').NextConfig} */
import ArcoWebpackPlugin from '@arco-plugins/webpack-react';
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Important: return the modified config
    config.plugins.push(
      new ArcoWebpackPlugin({
        include: 'app',
        style: 'css'
      })
    );
    return config;
  }
};

export default nextConfig;
