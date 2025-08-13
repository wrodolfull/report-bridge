module.exports = {
  apps: [{
    name: 'report-bridge-backend',
    script: 'server.js',
    cwd: '/var/www/report-bridge',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/report-bridge-error.log',
    out_file: '/var/log/pm2/report-bridge-out.log',
    log_file: '/var/log/pm2/report-bridge-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
