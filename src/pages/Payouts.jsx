import { useMemo, useState } from 'react'
import { money, timeAgo } from '../lib/format'
import { Avatar } from '../components/Avatar'
import { DevGate } from '../components/DevGate'
import { useAdmin } from '../hooks/useAdmin'
import { useLivePayouts } from '../hooks/useLivePayouts'
import { sendPayouts } from '../lib/api'
import { safeHttpUrl } from '../lib/safeUrl'

const tabs = [
  { id: 'queued', label: 'To pay' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'sent', label: 'Paid' },
]

export function Payouts() {
  const { payouts, stats, pool, payable, error, loading, reload } = useLivePayouts()
  const { admin, unlock, lock } = useAdmin()
  const [tab, setTab] = useState('queued')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const list = payouts.filter((p) => p.status === tab)
  const ready = useMemo(
    () => payouts.filter((p) => p.status === 'queued' && !p.dust && p.wallet),
    [payouts],
  )

  async function pay(ids, tx) {
    const key = ids.join(',')
    setBusy(key)
    setNote('')
    try {
      await sendPayouts({ ids, tx })
      setNote(ids.length > 1 ? `Marked ${ids.length} paid.` : 'Marked paid.')
      await reload()
    } catch (err) {
      setNote(err.message || 'Could not mark paid.')
    } finally {
      setBusy('')
    }
  }

  return (
    <main className="mx-auto max-w-[880px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Payment</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Pay the scored tweets</h1>
          <p className="mt-3 max-w-[54ch] text-sm leading-6 text-mute">
            Bot picks Worth paying. This page splits this hour&apos;s pool and waits for the Dev
            wallet send. Dust under {money(0.5)} is skipped.
          </p>
        </div>
        <DevGate
          admin={admin}
          onUnlock={async (key) => {
            await unlock(key)
            await reload()
          }}
          onLock={lock}
        />
      </div>

      <div className="stagger mt-8 grid gap-3 sm:grid-cols-4">
        <Stat label="Hourly pool" value={money(pool)} />
        <Stat label="Ready to send" value={money(payable)} />
        <Stat label="Queued" value={stats.queued} />
        <Stat label="Paid" value={stats.sent} />
      </div>

      {admin && ready.length > 0 && (
        <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-mute">
            {ready.length} ready · {money(payable)} from the Dev wallet. Send SOL/USDC yourself,
            then mark paid.
          </p>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => pay(ready.map((p) => p.id))}
            className="btn btn-signal px-4 py-2 text-xs"
          >
            {busy ? 'Saving…' : `Mark ${ready.length} paid`}
          </button>
        </div>
      )}

      <div className="mt-8 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? 'bg-cream text-ink' : 'border border-cream/10 text-mute'
            }`}
          >
            {t.label}
            {stats[t.id] != null ? ` · ${stats[t.id]}` : ''}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-signal">{error}</p>}
      {note && <p className="mt-4 text-sm text-mute">{note}</p>}

      <div key={tab} className="stagger fade-swap mt-6 grid gap-3">
        {loading && list.length === 0 ? (
          <p className="text-sm text-mute">Loading the payment queue…</p>
        ) : list.length === 0 ? (
          <div className="panel p-5 text-sm leading-6 text-mute">
            {tab === 'queued' && 'Nobody to pay yet. A Worth paying tweet with a wallet lands here.'}
            {tab === 'blocked' && 'No blocked rows. Those are Worth paying tweets with no wallet.'}
            {tab === 'sent' && 'Nothing marked paid yet. Transfer first, then mark paid.'}
          </div>
        ) : (
          list.map((p) => (
            <PaymentCard
              key={p.id}
              payout={p}
              admin={admin}
              busy={busy}
              onPay={(tx) => pay([p.id], tx)}
            />
          ))
        )}
      </div>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function PaymentCard({ payout, admin, busy, onPay }) {
  const [tx, setTx] = useState('')
  const [copied, setCopied] = useState('')
  const amount = Number(payout.amount_usd) || 0
  const paying = busy.split(',').includes(payout.id)

  async function copy(value, label) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('failed')
    }
  }

  return (
    <article className="panel lift p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar seed={payout.handle} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">
              @{payout.handle}
              {payout.dust && <span className="ml-2 text-[11px] font-medium text-signal">Dust</span>}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {amount > 0 ? money(amount) : payout.status === 'queued' ? 'Under $0.50' : payout.status}
            </p>
          </div>
          {payout.text && <p className="mt-2 text-sm leading-6 text-cream/80">{payout.text}</p>}
          <p className="mt-2 text-xs text-mute">
            {payout.reason || 'Waiting for the Dev wallet send.'}
            {payout.created_at ? ` · ${timeAgo(payout.created_at)}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {payout.wallet ? (
          <button
            type="button"
            onClick={() => copy(payout.wallet, 'wallet')}
            className="rounded-lg border border-cream/10 px-3 py-1.5 text-mute hover:text-cream"
          >
            {copied === 'wallet' ? 'Wallet copied' : shortWallet(payout.wallet)}
          </button>
        ) : (
          <span className="rounded-lg border border-cream/10 px-3 py-1.5 text-mute">
            {payout.hasWallet ? 'Wallet linked' : 'No wallet'}
          </span>
        )}
        {amount > 0 && (
          <button
            type="button"
            onClick={() => copy(String(amount), 'amount')}
            className="rounded-lg border border-cream/10 px-3 py-1.5 text-mute hover:text-cream"
          >
            {copied === 'amount' ? 'Amount copied' : money(amount)}
          </button>
        )}
        {safeHttpUrl(payout.url) && (
          <a
            href={safeHttpUrl(payout.url)}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1.5 text-signal hover:underline"
          >
            Open tweet
          </a>
        )}
        {payout.tx && <span className="truncate px-2 py-1.5 text-mute">tx {shortWallet(payout.tx)}</span>}
      </div>

      {admin && payout.status === 'queued' && !payout.dust && payout.wallet && (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            onPay(tx.trim())
          }}
        >
          <input
            value={tx}
            onChange={(e) => setTx(e.target.value)}
            placeholder="Tx signature after you send"
            className="flex-1 rounded-xl border border-cream/12 bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button type="submit" disabled={paying} className="btn btn-signal px-4 py-2.5 text-xs">
            {paying ? 'Saving…' : 'Mark paid'}
          </button>
        </form>
      )}
    </article>
  )
}

function shortWallet(value) {
  const text = String(value)
  if (text.length < 12) return text
  return `${text.slice(0, 4)}…${text.slice(-4)}`
}
