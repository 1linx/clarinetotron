import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

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

export function validateAdminCredentials(username: string, password: string): boolean {
  const admins = [
    { u: process.env.ADMIN_1_USERNAME, p: process.env.ADMIN_1_PASSWORD },
    { u: process.env.ADMIN_2_USERNAME, p: process.env.ADMIN_2_PASSWORD },
  ]
  return admins.some(
    (a) => a.u && a.p && a.u === username && a.p === password
  )
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
