import dotenv from 'dotenv'

// Load env files in a Next.js-like order BEFORE importing the socket server.
// This is required because imported modules may read env vars during module initialization.
const isProd = process.env.NODE_ENV === 'production'
const envFiles = isProd
  ? ['.env.production.local', '.env.production', '.env.local', '.env']
  : ['.env.local', '.env']

for (const p of envFiles) {
  dotenv.config({ path: p })
}

// Import the actual server after env is loaded.
void import('./socket-server')
