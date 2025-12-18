/**
 * PM2 Ecosystem Configuration for HafiPortrait Photography Platform
 * Manages both Next.js application and Socket.IO server
 */

module.exports = {
  apps: [
    {
      name: 'main',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_SOCKET_URL: 'https://socketio.hafiportrait.photography'
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
    },
    {
      name: 'socket',
      script: './server/socket-server.js',
      instances: 1, // Single instance, uses Redis for scaling
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001,
        REDIS_URL: 'redis://:Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M=@localhost:6379',
        ALLOWED_ORIGINS: 'https://hafiportrait.photography,https://www.hafiportrait.photography'
      },
      error_file: './logs/socket-error.log',
      out_file: './logs/socket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: '124.197.42.88',
      ref: 'origin/main',
      repo: 'git@git@bitbucket.org:ylexai/hafi.git',
      path: '/var/www/hafiportrait',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --legacy-peer-deps && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
