/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.GITHUB_PAGES === 'true' && {
    output: 'export',
    basePath: '/health-one-app',
    trailingSlash: true,
  }),
  images: { unoptimized: true },
};

export default nextConfig;
