// PM2 ecosystem configuration for Raspberry Pi production deployment
module.exports = {
  apps: [
    {
      name: 'seedling',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};
