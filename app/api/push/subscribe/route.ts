import { NextRequest, NextResponse } from 'next/server'
import { savePushSubscription } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }
    await savePushSubscription(subscription)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
