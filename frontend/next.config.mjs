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
  images: { unoptimized: true },
  turbopack: { root },
};

export default nextConfig;
