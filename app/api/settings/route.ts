import { NextRequest, NextResponse } from 'next/server'
import { getDailyTarget, setDailyTarget } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    const target = await getDailyTarget()
    return NextResponse.json({ daily_target_minutes: target })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { daily_target_minutes } = await request.json()
    if (!daily_target_minutes || daily_target_minutes < 1) {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
    }
    await setDailyTarget(Number(daily_target_minutes))
    return NextResponse.json({ daily_target_minutes: Number(daily_target_minutes) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
