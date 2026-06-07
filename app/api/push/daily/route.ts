import { NextRequest, NextResponse } from 'next/server'
import { getTodayLogs, getDailyTarget, getPushSubscription } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/push'
import { getAdminSession } from '@/lib/auth'

// Manual trigger endpoint — admin session required
export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const today = new Date().toISOString().split('T')[0]
    const [logs, target, subscription] = await Promise.all([
      getTodayLogs(today),
      getDailyTarget(),
      getPushSubscription(),
    ])

    if (!subscription) return NextResponse.json({ ok: true, message: 'No subscription' })

    const totalMinutes = logs.reduce((sum, l) => sum + l.data.duration_minutes, 0)
    const pct = Math.min(100, Math.round((totalMinutes / target) * 100))

    let body: string
    if (totalMinutes === 0) {
      body = `You haven't logged any practice today. Target: ${target} min.`
    } else if (totalMinutes >= target) {
      body = `Great work! You hit your ${target} min target with ${totalMinutes} min practised.`
    } else {
      body = `You've practised ${totalMinutes} of ${target} min today (${pct}%). Keep going!`
    }

    await sendPushNotification(subscription, {
      title: 'Clarinetotron — Daily Update',
      body,
      icon: '/icons/icon-192.svg',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
