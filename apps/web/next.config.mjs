/** @type {import('next').NextConfig} */
const apiProxyBase = (process.env.POS_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiProxyBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
