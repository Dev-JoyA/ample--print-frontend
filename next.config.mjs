import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  images: {
    domains: ['localhost', 'via.placeholder.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
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
            pathname: '/api/v1/attachments/images/**',  
        },
        {
            protocol: 'https',
            hostname: 'your-production-domain.com',
            pathname: '/api/v1/attachments/images/**',  
        },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
        pathname: '/api/v1/receipts/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/receipts/**',
      },
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        port: '',
        pathname: '/api/v1/attachments/download/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/images/:filename',
        destination: '/api/images/:filename',
      },
      {
        source: '/api/receipts/:filename',
        destination: '/api/receipts/:filename',
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;