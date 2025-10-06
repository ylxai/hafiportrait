module.exports = {
  apps: [
    {
      name: 'hafiportrait-app',
      script: 'pnpm',
      args: 'start',
      exec_mode: 'cluster',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://hafiportrait.photography'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://hafiportrait.photography'
      },
      env_file: '.env.production',
      log_file: './logs/app-prod-combined.log',
      out_file: './logs/app-prod-out.log',
      error_file: './logs/app-prod-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'hafiportrait-socketio',
      script: 'node',
      args: 'socketio-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        SOCKETIO_PORT: 3001,
        SOCKETIO_DOMAIN: 'socket.hafiportrait.photography',
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        SOCKETIO_PORT: 3001,
        SOCKETIO_DOMAIN: 'socket.hafiportrait.photography',
        HOST: '0.0.0.0'
      },
      env_file: '.env.production',
      log_file: './logs/socketio-prod-combined.log',
      out_file: './logs/socketio-prod-out.log',
      error_file: './logs/socketio-prod-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
