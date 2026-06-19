/**
 * Add or update a user in the shared users table.
 * Usage: node scripts/create-user.mjs <username> <password>
 *
 * Loads credentials from .env.local automatically.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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
} catch { /* rely on env already set */ }

const [,, username, password] = process.argv
if (!username || !password) {
  console.error('Usage: node scripts/create-user.mjs <username> <password>')
  process.exit(1)
}

const { createClient } = await import('@supabase/supabase-js')
const bcrypt = (await import('bcryptjs')).default

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const APP = 'clarinetotron'
const BCRYPT_ROUNDS = 12

const hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

const { error } = await supabase
  .from('users')
  .upsert({ app: APP, username, password_hash: hash }, { onConflict: 'app,username' })

if (error) {
  console.error('Failed to create user:', error.message)
  process.exit(1)
}

console.log(`User "${username}" created/updated for app "${APP}".`)
