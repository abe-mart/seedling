module.exports = {
  apps: [{
    name: 'seedling-v2',
    script: 'backend/server.js',
    cwd: '/home/pi/seedling/v2',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    error_file: '/home/pi/seedling/v2/logs/error.log',
    out_file: '/home/pi/seedling/v2/logs/out.log',
    log_file: '/home/pi/seedling/v2/logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }, {
    name: 'seedling-scheduler',
    script: 'backend/scheduler.js',
    cwd: '/home/pi/seedling/v2',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/home/pi/seedling/v2/logs/scheduler-error.log',
    out_file: '/home/pi/seedling/v2/logs/scheduler-out.log',
    log_file: '/home/pi/seedling/v2/logs/scheduler-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
