module.exports = {
  apps: [
    {
      name: 'upload-api',
      script: 'dist/server.js',
      cwd: '/var/www/html/hafiportrait/upload-api',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        UPLOAD_API_PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        UPLOAD_API_PORT: 4000,
      },
      error_file: '/var/log/pm2/upload-api-error.log',
      out_file: '/var/log/pm2/upload-api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
