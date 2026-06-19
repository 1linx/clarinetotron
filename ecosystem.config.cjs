const { readFileSync } = require('fs')
const { resolve } = require('path')

const REMOTE_DIR = '/home/ubuntu/clarinetotron'

// Load .env.local into the env object PM2 passes to each process
const env = {}
try {
  const file = readFileSync(resolve(REMOTE_DIR, '.env.local'), 'utf8')
  for (const line of file.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
} catch { /* .env.local not present — rely on vars already in process.env */ }

module.exports = {
  apps: [
    {
      name: 'clarinetotron',
      script: `${REMOTE_DIR}/.next/standalone/server.js`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        ...env,
        NODE_ENV: 'production',
        PORT: 9070,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'daily-notification',
      script: `${REMOTE_DIR}/scripts/daily-notification.mjs`,
      cron_restart: '0 20 * * *',
      watch: false,
      autorestart: false,
      instances: 1,
      env: {
        ...env,
        NODE_PATH: `${REMOTE_DIR}/.next/standalone/node_modules`,
      },
    },
  ],
}
