import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@on-track/core', '@on-track/tokens'],
  // Hanya berlaku di `next dev`: izinkan dibuka lewat tunnel Cloudflare untuk dicoba teman.
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
