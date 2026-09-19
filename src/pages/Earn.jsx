import { useEffect, useMemo, useState } from 'react'
import { CONFIG, tweetIntentUrl } from '../config'
import { Avatar } from '../components/Avatar'
import { WalletButton } from '../components/WalletButton'
import { useAuth } from '../providers/AuthProvider'
import { registerTweet } from '../lib/api'
import { useLiveTweets } from '../hooks/useLiveTweets'

const STORAGE = 'twek-earn-v1'
const SUGGESTIONS = [
  'Just tweeted $TWEK and they pay you for it. Tweet the ticker, get paid.',
  'The utility is the tweet. $TWEK scores $TWEK posts and pays dollars.',
  'If you can post, you can earn. $TWEK',
]

function loadMine() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || '[]')
  } catch {
    return []
  }
}

export function Earn() {
  const { authenticated, xHandle, xName, address, linkX, login, authNote } = useAuth()
  const { pull } = useLiveTweets()
  const [text, setText] = useState(CONFIG.tweetTemplate)
  const [mine, setMine] = useState(loadMine)
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(mine))
  }, [mine])

  const earned = useMemo(
    () => mine.filter((t) => t.verdict === 'pay').length,
    [mine],
  )
  const valid = text.includes('$TWEK')
  const remaining = 280 - text.length

  async function register(source = 'composer') {
    if (!authenticated) {
      setNote('Connect a wallet first.')
      login()
      return
    }
    if (!xHandle) {
      setNote('Link your X account so we know who to pay.')
      linkX()
      return
    }
    if (source === 'url' && !url.trim()) {
      setNote('Paste a tweet URL.')
      return
    }
    if (source === 'composer' && !valid) {
      setNote('Tweet must include $TWEK.')
      return
    }
    if (!pull.enabled) {
      setNote('X lookup is paused until launch. Post on X, then come back after go-live.')
      return
    }
    setNote('Looking the tweet up on X…')
    try {
      const data = await registerTweet(
        source === 'url'
          ? { url, handle: xHandle, wallet: address }
          : { handle: xHandle, text, wallet: address },
      )
      const tweet = data.tweet
      setMine((list) => [tweet, ...list.filter((t) => t.id !== tweet.id)])
      setUrl('')
      const mark =
        tweet.verdict === 'pay' ? 'Worth paying' : tweet.verdict === 'skip' ? 'Skip' : 'Watch'
      setNote(`${mark}. Score ${tweet.score}. ${tweet.reasons?.[0] || ''}`)
    } catch (err) {
      setNote(err.message || 'Could not score that tweet.')
    }
  }

  return (
    <main className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Earn</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Tweet. Get scored. Get paid.</h1>
      <p className="mt-4 max-w-xl text-mute">
        Connect with Privy, post $TWEK, and we route dollars to the handle that wrote the tweet.
      </p>

      <div className="stagger mt-8 grid gap-3 sm:grid-cols-3">
        <Step n="01" title="Wallet" body="Connect your main Phantom or Solflare wallet, then link X." />
        <Step n="02" title="Cashtag" body="Original $TWEK posts outrank raids and copy-paste." />
        <Step n="03" title="Payout" body="Hourly settlement. Dust under $0.50 is skipped." />
      </div>

      <section className="panel mt-10 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar seed={xHandle || 'twek'} className="h-11 w-11" />
            <div>
              <p className="text-sm font-semibold">{xHandle ? `@${xHandle}` : 'Not linked'}</p>
              <p className="text-xs text-mute">
                {xName ? xName : 'Connect wallet, then link X'} · {earned} worth paying this session
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <WalletButton />
            {!xHandle && (
              <button type="button" onClick={linkX} className="btn btn-ghost">
                Link X
              </button>
            )}
          </div>
        </div>
        {authNote && <p className="mt-3 text-sm text-signal">{authNote}</p>}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          className="mt-6 min-h-[140px] w-full resize-none rounded-xl border border-cream/10 bg-ink px-4 py-3 text-[15px] leading-6 outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className={valid ? 'text-gold' : 'text-signal'}>
            {valid ? 'Cashtag detected' : 'Add $TWEK to qualify'}
          </p>
          <p className={remaining < 20 ? 'text-signal' : 'text-mute'}>{remaining}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              className="rounded-lg border border-cream/10 px-3 py-1 text-xs text-mute hover:text-cream"
            >
              Use line
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={tweetIntentUrl(text)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-signal px-5 py-2.5"
          >
            Post on X
          </a>
          <button
            type="button"
            disabled={!pull.enabled}
            onClick={() => register('composer')}
            className="btn btn-ghost px-5 py-2.5"
          >
            I posted this
          </button>
        </div>
        {note && <p className="fade-swap mt-4 text-sm text-mute">{note}</p>}
      </section>

      <section className="panel mt-3 p-5 sm:p-6">
        <p className="text-sm font-semibold">Already posted?</p>
        <p className="mt-1 text-sm text-mute">
          Paste the tweet URL after launch. X lookup is paused now so credits are not spent.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://x.com/you/status/…"
            className="flex-1 rounded-xl border border-cream/12 bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button
            type="button"
            disabled={!pull.enabled}
            onClick={() => register('url')}
            className="btn btn-signal"
          >
            Register tweet
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold tracking-tight">Your tweets</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-mute">Nothing registered yet. Post $TWEK and come back.</p>
        ) : (
          <ul className="stagger mt-4 grid gap-3">
            {mine.map((t) => (
              <li key={t.id} className="panel lift fade-swap flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm leading-6 text-cream/80">{t.text}</p>
                  {t.reasons?.[0] && <p className="mt-2 text-xs text-mute">{t.reasons[0]}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs ${t.verdict === 'pay' ? 'text-gold' : t.verdict === 'skip' ? 'text-signal' : 'text-mute'}`}>
                    {t.verdict === 'pay' ? 'Worth paying' : t.verdict === 'skip' ? 'Skip' : 'Watch'}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{t.score ?? '—'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function Step({ n, title, body }) {
  return (
    <div className="panel lift p-4">
      <p className="display text-lg font-extrabold text-signal">{n}</p>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-mute">{body}</p>
    </div>
  )
}
