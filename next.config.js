/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Minimal webpack configuration to avoid conflicts
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }
    
    // Server-side optimizations only
    if (isServer) {
      // Exclude problematic client-side libraries from server bundle
      config.externals = config.externals || []
      config.externals.push({
        'socket.io-client': 'socket.io-client',
        'framer-motion': 'framer-motion',
        'yet-another-react-lightbox': 'yet-another-react-lightbox',
        'embla-carousel-react': 'embla-carousel-react',
        'googleapis': 'googleapis',
        'googleapis-common': 'googleapis-common',
      })
    }
    
    return config
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled - causes critters module not found error
  },
  
  images: {
    domains: ['localhost', 'api.qrserver.com', 'azspktldiblhrwebzmwq.supabase.co', '147.251.255.227', 'photos.hafiportrait.photography'],
    formats: ['image/webp', 'image/avif'],
  },
  
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL_INTERNAL: 'http://localhost:3000',
  },
  
  // Optimizations
  poweredByHeader: false,
  compress: true,
  
  // Custom server configuration
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/test/db',
      },
    ];
  },
}

module.exports = nextConfig