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
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_file: '.env.local',
      log_file: './logs/app-combined.log',
      out_file: './logs/app-out.log',
      error_file: './logs/app-error.log',
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
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        SOCKETIO_PORT: 3001,
        HOST: '0.0.0.0'
      },
      log_file: './logs/socketio-combined.log',
      out_file: './logs/socketio-out.log',
      error_file: './logs/socketio-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};