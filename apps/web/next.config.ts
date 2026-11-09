import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@on-track/core', '@on-track/tokens'],
};

export default nextConfig;
