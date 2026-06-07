import { NextRequest, NextResponse } from 'next/server'
import { validateAdminCredentials, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const token = createToken(username)
    const jar = await cookies()
    jar.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return NextResponse.json({ ok: true, username })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
