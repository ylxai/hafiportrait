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
    // Fix webpack cache performance warning
    config.cache = {
      type: 'filesystem',
      compression: 'gzip',
      maxAge: 5184000000,
      maxMemoryGenerations: 1,
    }
    // Enhanced webpack configuration for TypeScript/JSX
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }
    
    // Fix webpack cache serialization warnings
    config.cache = {
      ...config.cache,
      compression: 'gzip',
      maxAge: 5184000000, // 60 days
    }
    
    // Enhanced module resolution
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json']
    
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
        'sharp': 'sharp',
        'bcryptjs': 'bcryptjs',
        'jsonwebtoken': 'jsonwebtoken'
      })
    }

    // Handle Edge Runtime warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
  reactStrictMode: true,
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript error checking
  },
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint checking
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
    // DATABASE_URL removed - should not be exposed to client-side
    // Only use NEXT_PUBLIC_ prefixed vars for client-side data
    NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL_INTERNAL || 'http://localhost:3002',
  },
  
  // Optimizations
  poweredByHeader: false,
  compress: true,
  
  // Experimental features for App Router - duplicate removed

  // Custom server configuration
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },
}

module.exports = nextConfig