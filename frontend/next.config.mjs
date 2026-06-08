import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.GITHUB_PAGES === 'true' && {
    output: 'export',
    basePath: '/health-one-app',
    trailingSlash: true,
  }),
  ...(process.env.GITHUB_PAGES !== 'true' && {
    async rewrites() {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.HEALTH_ONE_BACKEND_URL ?? 'https://health-one-api.onrender.com/v1'}/:path*`,
        },
      ];
    },
  }),
  images: { unoptimized: true },
  turbopack: { root },
};

export default nextConfig;
