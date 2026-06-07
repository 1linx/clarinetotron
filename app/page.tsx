'use client'

import { useEffect, useState, useCallback } from 'react'

interface PracticeLog {
  id: string
  date: string
  data: { start_time: string; duration_minutes: number }
  created_at: string
}

function ProgressRing({ minutes, target }: { minutes: number; target: number }) {
  const radius = 80
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const pct = Math.min(1, minutes / target)
  const offset = circumference - pct * circumference
  const done = minutes >= target

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} className="rotate-[-90deg] absolute inset-0">
        <circle cx={radius} cy={radius} r={normalizedRadius} stroke="#e2e8f0" strokeWidth={stroke} fill="transparent" />
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={done ? '#22c55e' : '#6366f1'}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className={`text-3xl font-bold ${done ? 'text-green-500' : 'text-indigo-600'}`}>{minutes}</span>
        <span className="text-xs text-slate-400">/ {target} min</span>
      </div>
    </div>
  )
}

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export default function HomePage() {
  const [logs, setLogs] = useState<PracticeLog[]>([])
  const [target, setTarget] = useState(30)
  const [showModal, setShowModal] = useState(false)
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [duration, setDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [subscribing, setSubscribing] = useState(false)

  const today = todayDate()
  const totalMinutes = logs.reduce((sum, l) => sum + l.data.duration_minutes, 0)
  const done = totalMinutes >= target

  const loadData = useCallback(async () => {
    const [logsRes, settingsRes] = await Promise.all([
      fetch(`/api/practice?date=${today}`),
      fetch('/api/settings'),
    ])
    if (logsRes.ok) setLogs(await logsRes.json())
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      setTarget(s.daily_target_minutes)
    }
  }, [today])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotifStatus('unsupported')
    } else {
      setNotifStatus(Notification.permission as 'granted' | 'denied' | 'unknown')
    }
  }, [])

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!duration || Number(duration) < 1) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: startTime, duration_minutes: Number(duration), date: today }),
      })
      if (res.ok) {
        await loadData()
        setShowModal(false)
        setDuration('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch('/api/practice', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadData()
  }

  async function handleEnableNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setNotifStatus('denied'); return }
      setNotifStatus('granted')
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
    } catch (err) {
      console.error('Push subscribe error', err)
    } finally {
      setSubscribing(false)
    }
  }

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-8">
      <header className="w-full max-w-sm flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clarinetotron</h1>
          <p className="text-sm text-slate-400">{dateLabel}</p>
        </div>
        <span className="text-3xl" role="img" aria-label="music note">🎶</span>
      </header>

      {notifStatus === 'unknown' && (
        <div className="w-full max-w-sm bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-indigo-700">Enable daily practice reminders?</p>
          <button
            onClick={handleEnableNotifications}
            disabled={subscribing}
            className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {subscribing ? 'Enabling…' : 'Enable'}
          </button>
        </div>
      )}

      <div className="mb-4">
        <ProgressRing minutes={totalMinutes} target={target} />
      </div>

      {done ? (
        <p className="text-green-600 font-semibold text-lg mb-6">Target reached! 🎉</p>
      ) : (
        <p className="text-slate-500 text-sm mb-6">
          {target - totalMinutes} min left to reach your {target} min target
        </p>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition mb-8 shadow"
      >
        + Log Practice
      </button>

      {logs.length > 0 && (
        <section className="w-full max-w-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today&apos;s sessions</h2>
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm border border-slate-100">
                <div>
                  <span className="font-medium text-slate-700">{log.data.duration_minutes} min</span>
                  <span className="text-slate-400 text-sm ml-2">at {formatTime(log.data.start_time)}</span>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-slate-300 hover:text-red-400 transition text-xl leading-none"
                  aria-label="Delete session"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 mb-5">Log Practice Session</h2>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Start time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
