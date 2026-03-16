import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
        pathname: '/api/v1/attachments/download/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
        pathname: '/api/v1/receipts/**',
      },
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