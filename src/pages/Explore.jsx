import { useMemo, useState } from 'react'
import { DevGate } from '../components/DevGate'
import { TweetCard } from '../components/TweetCard'
import { useAdmin } from '../hooks/useAdmin'
import { useLiveTweets } from '../hooks/useLiveTweets'
import { analyzeTweet, markTweet } from '../lib/api'
import { timeAgo } from '../lib/format'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'pay', label: 'Worth paying' },
  { id: 'watch', label: 'Watch' },
  { id: 'skip', label: 'Skip' },
]

export function Explore() {
  const { tweets, stats, configured, syncedAt, pull, error, loading, refresh, reload } = useLiveTweets()
  const { admin, unlock, lock } = useAdmin()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [handle, setHandle] = useState('')
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => {
    let next = [...tweets]
    if (filter !== 'all') next = next.filter((t) => t.verdict === filter)
    if (q.trim()) {
      const s = q.toLowerCase()
      next = next.filter(
        (t) =>
          t.text.toLowerCase().includes(s) ||
          t.handle.toLowerCase().includes(s) ||
          t.name.toLowerCase().includes(s),
      )
    }
    return next
  }, [tweets, filter, q])

  async function analyze(event) {
    event.preventDefault()
    if (!text.trim()) {
      setNote('Paste the tweet text. This does not spend X credits.')
      return
    }
    setBusy(true)
    setNote('Scoring…')
    try {
      const data = await analyzeTweet({ handle, text, save: true })
      setNote(
        `${data.tweet.verdict === 'pay' ? 'Worth paying' : data.tweet.verdict === 'skip' ? 'Skip' : 'Watch'} · score ${data.tweet.score}`,
      )
      setText('')
      await reload()
    } catch (err) {
      setNote(err.message || 'Could not score that.')
    } finally {
      setBusy(false)
    }
  }

  async function mark(id, verdict) {
    try {
      await markTweet(id, verdict)
      await reload()
    } catch (err) {
      setNote(err.message || 'Could not update mark.')
    }
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Board</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Live $TWEK posts</h1>
          <p className="mt-2 max-w-[54ch] text-sm leading-6 text-mute">
            {pull.enabled
              ? `Real posts from X. After the first pull we check every ${pull.everyMinutes}m for new tweets only, ${pull.max} at a time.`
              : 'X search is paused. Live $TWEK posts are not pulled, so credits stay put.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search handle or text"
            className="w-full max-w-xs rounded-xl border border-cream/12 bg-ink-2 px-4 py-2.5 text-sm outline-none placeholder:text-mute"
          />
          {admin && pull.enabled && (
            <button type="button" onClick={refresh} className="btn btn-ghost px-3 py-2 text-xs">
              {loading ? 'Pulling…' : 'Pull now'}
            </button>
          )}
          <DevGate admin={admin} onUnlock={unlock} onLock={lock} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.id ? 'bg-cream text-ink' : 'border border-cream/10 text-mute'
            }`}
          >
            {f.label}
            {f.id !== 'all' && stats[f.id] != null ? ` · ${stats[f.id]}` : f.id === 'all' ? ` · ${stats.seen}` : ''}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-signal">{error}</p>}
      {!configured && (
        <div className="panel mb-6 p-5">
          <p className="font-semibold">X stream is waiting on a bearer token</p>
          <p className="mt-2 text-sm leading-6 text-mute">
            Privy login is separate. To read public $TWEK posts, add an X API v2 app-only bearer as{' '}
            <span className="font-mono text-cream">X_BEARER_TOKEN</span> in <span className="font-mono">.env.local</span>,
            then restart. Developer portal → your app → Keys → Bearer Token.
          </p>
        </div>
      )}
      {configured && (
        <p className="mb-4 text-xs text-mute">
          {pull.enabled
            ? `${syncedAt ? `Last X pull ${timeAgo(syncedAt)}` : 'No X pull yet — paste a tweet below, that is free'}${
                pull.sinceId ? ' · since_id on' : ''
              } · X pull cooldown 90s`
            : 'X search off · paste below is free and does not call X'}
        </p>
      )}

      {admin && (
        <form onSubmit={analyze} className="panel mb-6 grid gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Analyze a post</p>
          <p className="mt-1 text-sm text-mute">
            Paste text now. No X credits. Live search stays off while X_PULL is off.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
            placeholder="handle"
            className="w-full rounded-xl border border-cream/12 bg-transparent px-4 py-2.5 text-sm outline-none sm:max-w-[12rem]"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder="Tweet text, must include $TWEK"
            rows={2}
            className="min-h-[44px] flex-1 resize-y rounded-xl border border-cream/12 bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button type="submit" disabled={busy} className="btn btn-signal px-4 py-2.5 sm:self-start">
            {busy ? 'Scoring…' : 'Score & add'}
          </button>
        </div>
        {note && <p className="text-sm text-mute">{note}</p>}
        </form>
      )}

      {list.length === 0 ? (
        <div className="panel p-6">
          <p className="font-semibold">{configured ? 'No matching posts yet' : 'No live posts'}</p>
          <p className="mt-2 text-sm leading-6 text-mute">
            {admin
              ? pull.enabled
                ? 'Paste a $TWEK post above to score it, or Pull now when you want a live search.'
                : 'X search is paused. Paste a $TWEK post above to score it without spending credits.'
              : 'Public $TWEK posts land here after a pull. Use Earn to connect a wallet and link X.'}
          </p>
        </div>
      ) : (
        <div key={`${filter}-${q}`} className="stagger fade-swap grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TweetCard key={t.id} tweet={t} onMark={admin ? mark : undefined} />
          ))}
        </div>
      )}
    </main>
  )
}
