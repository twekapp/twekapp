import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { money, timeAgo } from '../lib/format'
import { Avatar } from '../components/Avatar'
import { TweetCard } from '../components/TweetCard'
import { RollingNumber } from '../components/RollingNumber'
import { WalletButton } from '../components/WalletButton'
import { PayoutRow } from '../components/PayoutRow'
import { MarqueeList } from '../components/Marquee'
import { useLiveTweets } from '../hooks/useLiveTweets'
import { useLivePayouts } from '../hooks/useLivePayouts'
import { SocialX } from '../components/SocialX'

export function Home() {
  const live = useLivePayouts()
  return (
    <main>
      <Hero payouts={live.payouts} stats={live.stats} />
      <HowItWorks />
      <LiveBoard />
      <LeaderTape payouts={live.payouts} />
      <PoolStrip payouts={live.payouts} stats={live.stats} pool={live.pool} />
    </main>
  )
}

function Hero({ payouts, stats }) {
  const sentUsd = payouts
    .filter((p) => p.status === 'sent')
    .reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0)

  return (
    <section className="stagger mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-12 pt-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:pt-16">
      <div>
        <p className="inline-flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-signal">
          Live bounty
        </p>
        <h1 className="mt-5 text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-[68px]">
          Post $RYIOT.
          <br />
          Cash the tweet.
        </h1>
        <p className="mt-5 max-w-[460px] text-[16px] leading-7 text-mute sm:text-[17px]">
          The Dev wallet funds a public pool. Anyone who posts the cashtag gets scored and paid in
          dollars. Wallet in, tweet out, payout lands.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/earn" className="btn btn-signal px-5 py-2.5">
            Start earning
          </Link>
          <WalletButton />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <p className="text-sm text-mute">
            <span className="font-semibold text-cream">
              <RollingNumber value={sentUsd} />
            </span>{' '}
            sent · {stats.queued} queued
          </p>
          <SocialX className="text-sm" />
        </div>
      </div>
      <div className="relative h-[420px] overflow-hidden rounded-[14px] border border-cream/12 bg-ink-2 p-3 sm:h-[460px]">
        <div className="mb-3 flex items-center justify-between px-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">Live payouts</p>
          <Link to="/payouts" className="text-xs text-signal hover:underline">
            Payment
          </Link>
        </div>
        {payouts.length === 0 ? (
          <p className="px-2 pt-8 text-sm leading-6 text-mute">
            No payout rows yet. Worth paying tweets show up here after the bot scores them.
          </p>
        ) : (
          <MarqueeList>
            {payouts.map((p) => (
              <PayoutRow key={p.id} payout={p} />
            ))}
          </MarqueeList>
        )}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Connect wallet', body: 'Privy opens Phantom or Solflare — your main Solana wallet.' },
    { n: '02', title: 'Tweet $RYIOT', body: 'Original posts rank higher than raids. One cashtag is the claim ticket.' },
    { n: '03', title: 'Get paid', body: 'Hourly settlement in dollars. Dust under $0.50 is skipped.' },
  ]
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
      <div className="stagger grid gap-3 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="panel lift p-5">
            <p className="display text-2xl font-extrabold text-signal">{s.n}</p>
            <p className="mt-3 text-lg font-semibold">{s.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-mute">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-mute">
        <Link to="/flow" className="text-signal hover:underline">
          See how the money moves →
        </Link>
      </p>
    </section>
  )
}

function LiveBoard() {
  const { tweets, stats: live, configured, pull, error } = useLiveTweets()
  const [filter, setFilter] = useState('All')
  const list = tweets
    .filter((t) => (filter === 'Worth paying' ? t.verdict === 'pay' : true))
    .slice(0, 6)

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">The board</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Live $RYIOT posts</h2>
          <p className="mt-2 text-sm text-mute">
            {configured
              ? `${live.seen} on the board · ${live.pay} worth paying · ${live.skip} skipped${
                  pull.enabled ? '' : ' · X search paused'
                }`
              : 'Waiting on an X bearer token to pull real posts.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Worth paying'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === f ? 'bg-cream text-ink' : 'border border-cream/10 text-mute'
              }`}
            >
              {f}
            </button>
          ))}
          <Link to="/explore" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-signal">
            Full board →
          </Link>
        </div>
      </div>
      {error && <p className="mb-4 text-sm text-signal">{error}</p>}
      {list.length === 0 ? (
        <div className="panel p-5 text-sm leading-6 text-mute">
          No live posts yet.{' '}
          {pull.enabled
            ? 'Pull now on the board after the official $RYIOT tweet.'
            : 'X search is paused.'}
        </div>
      ) : (
        <div key={filter} className="stagger fade-swap grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TweetCard key={t.id} tweet={t} />
          ))}
        </div>
      )}
    </section>
  )
}

function LeaderTape({ payouts }) {
  const ranks = useMemo(() => {
    const map = new Map()
    for (const p of payouts) {
      const cur = map.get(p.handle) || { handle: p.handle, count: 0, sent: 0 }
      cur.count += 1
      if (p.status === 'sent') cur.sent += 1
      map.set(p.handle, cur)
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [payouts])

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight">In the queue</h2>
        <Link to="/payouts" className="text-sm text-mute hover:text-cream">
          Payouts →
        </Link>
      </div>
      {ranks.length === 0 ? (
        <div className="panel p-5 text-sm text-mute">No handles in the payout table yet.</div>
      ) : (
        <div className="stagger grid gap-2">
          {ranks.map((e, i) => (
            <Link
              key={e.handle}
              to="/payouts"
              className="panel lift flex items-center gap-3 px-4 py-3 hover:bg-cream/[0.03]"
            >
              <span className="w-6 font-mono text-sm text-mute">{String(i + 1).padStart(2, '0')}</span>
              <Avatar seed={e.handle} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate font-semibold">@{e.handle}</p>
                <p className="text-xs text-mute">{e.count} payout row{e.count === 1 ? '' : 's'}</p>
              </div>
              <p className="ml-auto text-right text-sm font-semibold text-gold">
                {e.sent ? `${e.sent} sent` : 'queued'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function PoolStrip({ payouts, stats, pool }) {
  const sentUsd = payouts
    .filter((p) => p.status === 'sent')
    .reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0)
  const latest = payouts[0]
  const earners = new Set(payouts.map((p) => p.handle)).size

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
      <div className="panel grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">Hourly pool</p>
          <p className="mt-2 display text-4xl font-extrabold">
            <RollingNumber value={pool} />
          </p>
          <p className="mt-2 text-sm text-mute">
            {money(sentUsd)} sent · {stats.queued} queued · min claim {money(0.5)}
          </p>
        </div>
        <div className="stagger grid grid-cols-2 gap-3">
          <MiniStat label="Queued" value={stats.queued} />
          <MiniStat label="Earners" value={earners} />
          <MiniStat
            label="Latest"
            value={latest ? (Number(latest.amount_usd) > 0 ? money(latest.amount_usd, 0) : latest.status) : '—'}
          />
          <MiniStat label="When" value={latest ? timeAgo(latest.created_at) : '—'} />
        </div>
      </div>
    </section>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-cream/8 bg-ink px-3 py-3">
      <p className="text-[11px] uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
    </div>
  )
}
