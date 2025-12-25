/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // For Server Actions
    },
  },
  // CORRECT CONFIG for App Router API routes body size
  middlewareClientMaxBodySize: '500mb',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
