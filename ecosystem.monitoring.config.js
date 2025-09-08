module.exports = {
  apps: [
    {
      name: 'hafiportrait-monitoring',
      script: './scripts/automated-monitoring.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/monitoring/pm2.log',
      out_file: './logs/monitoring/pm2-out.log',
      error_file: './logs/monitoring/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
