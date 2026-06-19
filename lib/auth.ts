import crypto from 'crypto'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

const COOKIE_NAME = 'admin_session'
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const APP = 'clarinetotron'

function sign(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export function createToken(username: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET!
  const payload = Buffer.from(JSON.stringify({ username, iat: Date.now() })).toString('base64url')
  const sig = sign(payload, secret)
  return `${payload}.${sig}`
}

export function verifyToken(token: string): { username: string } | null {
  const secret = process.env.ADMIN_SESSION_SECRET!
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (sig !== sign(payload, secret)) return null
  let parsed: { username: string; iat: number }
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return null
  }
  if (Date.now() - parsed.iat > TOKEN_TTL_MS) return null
  return { username: parsed.username }
}

export async function validateAdminCredentials(username: string, password: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('app', APP)
    .eq('username', username)
    .maybeSingle()

  if (error || !data) return false
  return bcrypt.compare(password, data.password_hash)
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
