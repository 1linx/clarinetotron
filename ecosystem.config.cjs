module.exports = {
  apps: [
    {
      name: 'clarinetotron',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'daily-notification',
      script: 'scripts/daily-notification.mjs',
      // Fires at 20:00 server time every day — adjust to match your timezone
      cron_restart: '0 20 * * *',
      watch: false,
      autorestart: false,
      instances: 1,
    },
  ],
}
