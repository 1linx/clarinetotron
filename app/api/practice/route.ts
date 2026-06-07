import { NextRequest, NextResponse } from 'next/server'
import { supabase, getTodayLogs } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  try {
    const logs = await getTodayLogs(date)
    return NextResponse.json(logs)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_time, duration_minutes, date } = body
    if (!start_time || !duration_minutes || !date) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('records')
      .insert({ type: 'practice_log', date, data: { start_time, duration_minutes: Number(duration_minutes) } })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await supabase.from('records').delete().eq('id', id).eq('type', 'practice_log')
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
