import { useMemo, useState } from 'react'
import { compact, money } from '../lib/format'
import { RollingNumber } from '../components/RollingNumber'
import { Avatar } from '../components/Avatar'
import { useLivePayouts } from '../hooks/useLivePayouts'
import { useLiveTweets } from '../hooks/useLiveTweets'

function inRange(iso, range) {
  if (range === 'All' || !iso) return true
  const at = new Date(iso).getTime()
  if (!Number.isFinite(at)) return false
  const span = range === '1D' ? 86_400_000 : 30 * 86_400_000
  return Date.now() - at <= span
}

export function Analytics() {
  const [range, setRange] = useState('All')
  const live = useLivePayouts()
  const tweets = useLiveTweets()

  const rows = useMemo(
    () => live.payouts.filter((p) => inRange(p.sent_at || p.created_at, range)),
    [live.payouts, range],
  )
  const sent = rows.filter((p) => p.status === 'sent')
  const paid = sent.reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0)
  const earners = useMemo(() => {
    const map = new Map()
    for (const p of rows) {
      const cur = map.get(p.handle) || { handle: p.handle, tweets: 0, received: 0 }
      cur.tweets += 1
      if (p.status === 'sent') cur.received += Number(p.amount_usd) || 0
      map.set(p.handle, cur)
    }
    return [...map.values()].sort((a, b) => b.received - a.received || b.tweets - a.tweets)
  }, [rows])

  const path = useMemo(() => {
    const points = sent
      .slice()
      .reverse()
      .map((p) => Number(p.amount_usd) || 0)
    if (points.length < 2) return ''
    const max = Math.max(...points, 1)
    const min = Math.min(...points, 0)
    return points
      .map((v, i) => {
        const x = (i / (points.length - 1)) * 100
        const y = 100 - ((v - min) / (max - min || 1)) * 86 - 6
        return `${x},${y}`
      })
      .join(' ')
  }, [sent])

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Stats</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Attention, priced.</h1>
          <p className="mt-2 text-sm text-mute">Live payout table. Empty until tweets are scored and paid.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-cream/10 p-1 text-xs">
          {['1D', '30D', 'All'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${range === r ? 'bg-cream text-ink' : 'text-mute'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="stagger mt-8 grid gap-3 md:grid-cols-3">
        <Stat label="Paid out" value={<RollingNumber value={paid} />} />
        <Stat label="Tweets scored" value={compact(tweets.stats.seen)} />
        <Stat label="Unique earners" value={compact(earners.length)} />
      </div>

      <section className="panel mt-3 p-5">
        <p className="text-sm text-mute">Payout volume</p>
        {path ? (
          <svg viewBox="0 0 100 100" className="mt-4 h-56 w-full text-signal" preserveAspectRatio="none">
            <polyline fill="none" stroke="currentColor" strokeWidth="1.4" points={path} />
          </svg>
        ) : (
          <p className="mt-6 text-sm text-mute">No sent payouts in this range yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold tracking-tight">Leaderboard</h2>
        {earners.length === 0 ? (
          <div className="panel mt-4 p-5 text-sm text-mute">No handles in the payout table yet.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-[14px] border border-cream/10">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-mute">
                <tr className="border-b border-cream/10">
                  <th className="px-4 py-3 font-medium">Profile</th>
                  <th className="px-4 py-3 font-medium">Tweets</th>
                  <th className="px-4 py-3 font-medium text-right">Received</th>
                </tr>
              </thead>
              <tbody>
                {earners.map((e, i) => (
                  <tr key={e.handle} className="border-b border-cream/8 last:border-0 transition hover:bg-cream/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-5 font-mono text-mute">{String(i + 1).padStart(2, '0')}</span>
                        <Avatar seed={e.handle} className="h-8 w-8" />
                        <p className="text-xs text-mute">@{e.handle}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-mute">{e.tweets}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gold">{money(e.received)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="panel lift p-5">
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
    </div>
  )
}
