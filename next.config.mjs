/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
        pathname: '/api/v1/attachments/download/**',
      },
      // Add this if you also use HTTPS in production
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        port: '',
        pathname: '/api/v1/attachments/download/**',
      },
    ],
  },
};

export default nextConfig;