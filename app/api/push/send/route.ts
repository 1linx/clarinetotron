import { NextRequest, NextResponse } from 'next/server'
import { getPushSubscription } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/push'
import { getAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { title, body } = await request.json()
    if (!title || !body) return NextResponse.json({ error: 'Missing title or body' }, { status: 400 })
    const subscription = await getPushSubscription()
    if (!subscription) return NextResponse.json({ error: 'No push subscription found' }, { status: 404 })
    await sendPushNotification(subscription, { title, body, icon: '/icons/icon-192.svg' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
