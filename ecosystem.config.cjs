const REMOTE_DIR = '/home/ubuntu/clarinetotron'

module.exports = {
  apps: [
    {
      name: 'clarinetotron',
      script: `${REMOTE_DIR}/.next/standalone/server.js`,
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 9070,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'daily-notification',
      script: `${REMOTE_DIR}/scripts/daily-notification.mjs`,
      // Fires at 20:00 server time — adjust to match your timezone
      cron_restart: '0 20 * * *',
      watch: false,
      autorestart: false,
      instances: 1,
      env: {
        // Cron script uses the deps bundled inside the standalone build
        NODE_PATH: `${REMOTE_DIR}/.next/standalone/node_modules`,
      },
    },
  ],
}
