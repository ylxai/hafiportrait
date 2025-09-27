// Load environment variables properly per environment
const dotenv = require('dotenv');

// Load environment-specific .env file only
if (process.env.NODE_ENV === 'production') {
  // Production: only load .env.production
  dotenv.config({ path: '.env.production' });
  console.log('🚀 Production mode: Loading .env.production');
} else {
  // Development: only load .env.local
  dotenv.config({ path: '.env.local' });
  console.log('💻 Development mode: Loading .env.local');
}

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
    domains: ['localhost', 'api.qrserver.com', 'azspktldiblhrwebzmwq.supabase.co', '147.251.255.227', 'hafiportrait.photography', 'photos.hafiportrait.photography'],
    formats: ['image/webp', 'image/avif'],
  },
  
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL_INTERNAL: 'http://localhost:3000',
  },
  
  // Optimizations
  poweredByHeader: false,
  compress: true,
  
  // Experimental features for App Router
  experimental: {
    // Add any experimental features here if needed
  },

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