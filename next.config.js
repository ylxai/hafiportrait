/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // For Server Actions
    },
  },

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          // Never cache the service worker file; avoids stale SW after deploy.
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'hafiportrait.photography',
      },
      {
        protocol: 'https',
        hostname: 'www.hafiportrait.photography',
      },
      {
        protocol: 'https',
        hostname: 'cdn.hafiportrait.photography',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Exclude bcrypt and other native modules from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        'mock-aws-s3': false,
        'aws-sdk': false,
        nock: false,
        bcrypt: false,
      }
      // Exclude bcrypt from client bundle
      config.externals = [...(config.externals || []), 'bcrypt']
    }

    // Ignore specific problematic files
    config.module = {
      ...config.module,
      exprContextCritical: false,
    }

    return config
  },
  // Move serverComponentsExternalPackages to new location
  serverExternalPackages: ['bcrypt'],
}

module.exports = nextConfig
