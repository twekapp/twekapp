import { money, timeAgo } from '../lib/format'
import { Avatar } from './Avatar'

const statusLabel = {
  queued: 'Queued',
  blocked: 'Blocked',
  sent: 'Sent',
}

const bar = {
  queued: 'bg-gold',
  blocked: 'bg-cream/30',
  sent: 'bg-signal',
}

export function PayoutRow({ payout }) {
  const status = payout.status || 'queued'
  const amount = Number(payout.amount ?? payout.amount_usd) || 0
  const handle = payout.handle || 'unknown'
  const when = payout.created_at || payout.at
  const to = payout.wallet ? `@${handle}` : `@${handle} · no wallet`

  return (
    <div className="lift flex items-center gap-3 rounded-[12px] border border-cream/8 bg-ink-2 px-3.5 py-3">
      <div className={`h-8 w-[3px] rounded-full ${bar[status] || bar.queued}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold tracking-tight tabular-nums">
          {amount > 0 ? money(amount) : statusLabel[status] || status}
        </p>
        <p className="truncate text-[13px] text-mute">
          to <span className="font-medium text-cream/80">{payout.to || to}</span>
        </p>
      </div>
      <Avatar seed={handle} className="h-8 w-8" />
      <p className="w-10 text-right text-[11px] text-mute">{payout.time || (when ? timeAgo(when) : '')}</p>
    </div>
  )
}
