/** @type {import('next').NextConfig} */
const nextConfig = {
  // 实验性功能
  experimental: {
    // Next.js 14+ 中 App Router 默认启用，不需要此配置
  },

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 图片优化配置
  images: {
    domains: [
      'localhost',
      'example.com',
      // 添加其他允许的图片域名
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // 重写配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // 构建配置
  output: 'standalone',
  
  // TypeScript配置
  typescript: {
    // 在生产构建时忽略TypeScript错误
    ignoreBuildErrors: false,
  },

  // ESLint配置
  eslint: {
    // 在生产构建时忽略ESLint错误
    ignoreDuringBuilds: false,
  },

  // 压缩配置
  compress: true,

  // 电源配置
  poweredByHeader: false,

  // React严格模式
  reactStrictMode: true,

  // SWC配置
  swcMinify: true,
};

module.exports = nextConfig;
