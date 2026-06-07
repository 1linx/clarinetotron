'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface PracticeLog {
  id: string
  date: string
  data: { start_time: string; duration_minutes: number }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<string | null>(null)
  const [target, setTarget] = useState<number>(30)
  const [newTarget, setNewTarget] = useState('')
  const [targetSaving, setTargetSaving] = useState(false)
  const [targetMsg, setTargetMsg] = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')
  const [todayLogs, setTodayLogs] = useState<PracticeLog[]>([])
  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    const [meRes, settingsRes, logsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/settings'),
      fetch(`/api/practice?date=${today}`),
    ])
    const me = await meRes.json()
    if (!me.user) { router.push('/admin'); return }
    setAdminUser(me.user.username)
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      setTarget(s.daily_target_minutes)
    }
    if (logsRes.ok) setTodayLogs(await logsRes.json())
  }, [router, today])

  useEffect(() => { loadData() }, [loadData])

  async function handleTargetSave(e: React.FormEvent) {
    e.preventDefault()
    setTargetSaving(true)
    setTargetMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_target_minutes: Number(newTarget) }),
      })
      if (res.ok) {
        setTarget(Number(newTarget))
        setNewTarget('')
        setTargetMsg('Target updated.')
      } else {
        setTargetMsg('Failed to update.')
      }
    } finally {
      setTargetSaving(false)
    }
  }

  async function handleSendNotif(e: React.FormEvent) {
    e.preventDefault()
    setNotifSending(true)
    setNotifMsg('')
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: notifTitle, body: notifBody }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotifMsg('Notification sent!')
        setNotifTitle('')
        setNotifBody('')
      } else {
        setNotifMsg(data.error ?? 'Failed to send.')
      }
    } finally {
      setNotifSending(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  const totalMinutes = todayLogs.reduce((sum, l) => sum + l.data.duration_minutes, 0)
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  if (!adminUser) return null

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-8">
      <header className="w-full max-w-sm flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">{adminUser}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600 transition">
          Logout
        </button>
      </header>

      {/* Today's summary */}
      <section className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today — {dateLabel}</h2>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${totalMinutes >= target ? 'text-green-500' : 'text-indigo-600'}`}>
            {totalMinutes}
          </span>
          <span className="text-slate-400">/ {target} min</span>
        </div>
        {todayLogs.length === 0 ? (
          <p className="text-sm text-slate-400 mt-2">No sessions logged yet today.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {todayLogs.map((log) => (
              <li key={log.id} className="text-sm text-slate-600">
                {log.data.duration_minutes} min at {log.data.start_time}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Daily target */}
      <section className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Daily Target</h2>
        <p className="text-sm text-slate-600 mb-3">Current target: <strong>{target} min/day</strong></p>
        <form onSubmit={handleTargetSave} className="flex gap-2">
          <input
            type="number"
            min="1"
            max="480"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="New target (min)"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <button
            type="submit"
            disabled={targetSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
          >
            {targetSaving ? '…' : 'Save'}
          </button>
        </form>
        {targetMsg && <p className="text-sm text-green-600 mt-2">{targetMsg}</p>}
      </section>

      {/* Send notification */}
      <section className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Send Notification</h2>
        <form onSubmit={handleSendNotif} className="space-y-3">
          <input
            type="text"
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
            placeholder="Title"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <textarea
            value={notifBody}
            onChange={(e) => setNotifBody(e.target.value)}
            placeholder="Message"
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            required
          />
          <button
            type="submit"
            disabled={notifSending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {notifSending ? 'Sending…' : 'Send Notification'}
          </button>
        </form>
        {notifMsg && (
          <p className={`text-sm mt-2 ${notifMsg.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
            {notifMsg}
          </p>
        )}
      </section>
    </main>
  )
}
