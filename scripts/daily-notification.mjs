/**
 * Run directly by PM2 on a cron schedule (see ecosystem.config.cjs).
 * Loads env from .env.local if present, otherwise expects vars in process.env.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Load .env.local when running outside Next.js (e.g. via PM2 cron)
try {
  const envFile = readFileSync(resolve(root, '.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
} catch {
  // .env.local not present — rely on environment variables already set
}

const { createClient } = await import('@supabase/supabase-js')
const webpush = (await import('web-push')).default

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function run() {
  const today = new Date().toISOString().split('T')[0]

  const [{ data: logs }, { data: settingRow }, { data: subRow }] = await Promise.all([
    supabase.from('records').select('*').eq('type', 'practice_log').eq('date', today),
    supabase.from('records').select('*').eq('type', 'setting').eq('data->>key', 'daily_target_minutes').maybeSingle(),
    supabase.from('records').select('*').eq('type', 'push_subscription').maybeSingle(),
  ])

  if (!subRow) {
    console.log('No push subscription found — skipping daily notification.')
    return
  }

  const target = settingRow ? settingRow.data.value : 30
  const totalMinutes = (logs ?? []).reduce((sum, l) => sum + l.data.duration_minutes, 0)
  const pct = Math.min(100, Math.round((totalMinutes / target) * 100))

  let body
  if (totalMinutes === 0) {
    body = `You haven't logged any practice today. Target: ${target} min.`
  } else if (totalMinutes >= target) {
    body = `Great work! You hit your ${target} min target with ${totalMinutes} min practised.`
  } else {
    body = `You've practised ${totalMinutes} of ${target} min today (${pct}%). Keep going!`
  }

  await webpush.sendNotification(subRow.data, JSON.stringify({
    title: 'Clarinetotron — Daily Update',
    body,
    icon: '/icons/icon-192.svg',
  }))

  console.log(`Daily notification sent: ${body}`)
}

run().catch((err) => { console.error('daily-notification failed:', err); process.exit(1) })
