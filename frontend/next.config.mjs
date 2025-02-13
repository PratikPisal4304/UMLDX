/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Match vercel.com
        protocol: 'https',
        hostname: 'vercel.com',
        pathname: '/**',
      },
      {
        // Match nextjs.org
        protocol: 'https',
        hostname: 'nextjs.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
