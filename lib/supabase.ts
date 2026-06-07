import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  }
  return _client
}
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export interface PracticeLog {
  id: string
  date: string
  data: { start_time: string; duration_minutes: number }
  created_at: string
}

export interface SettingRow {
  id: string
  data: { key: string; value: unknown }
}

export interface PushSubscriptionRow {
  id: string
  data: PushSubscriptionJSON
}

export async function getTodayLogs(date: string): Promise<PracticeLog[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('type', 'practice_log')
    .eq('date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as PracticeLog[]
}

export async function getDailyTarget(): Promise<number> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('type', 'setting')
    .eq('data->>key', 'daily_target_minutes')
    .maybeSingle()
  if (error) throw error
  if (!data) return 30
  return (data.data as { key: string; value: number }).value
}

export async function setDailyTarget(minutes: number): Promise<void> {
  await supabase.from('records').delete().eq('type', 'setting').eq('data->>key', 'daily_target_minutes')
  const { error } = await supabase
    .from('records')
    .insert({ type: 'setting', data: { key: 'daily_target_minutes', value: minutes } })
  if (error) throw error
}

export async function getPushSubscription(): Promise<PushSubscriptionJSON | null> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('type', 'push_subscription')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return data.data as PushSubscriptionJSON
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  await supabase.from('records').delete().eq('type', 'push_subscription')
  const { error } = await supabase
    .from('records')
    .insert({ type: 'push_subscription', data: subscription })
  if (error) throw error
}
