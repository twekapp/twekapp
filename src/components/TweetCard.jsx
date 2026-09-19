import { compact, timeAgo } from '../lib/format'
import { safeHttpUrl } from '../lib/safeUrl'
import { Avatar } from './Avatar'

const verdictStyle = {
  pay: 'bg-gold/15 text-gold',
  watch: 'bg-cream/10 text-cream',
  skip: 'bg-signal/15 text-signal',
}

const verdictLabel = {
  pay: 'Worth paying',
  watch: 'Watch',
  skip: 'Skip',
}

export function TweetCard({ tweet, compactCard = false, onMark }) {
  const verdict = tweet.verdict
  const href = safeHttpUrl(tweet.url)
  const factors = tweet.factors

  return (
    <article className="lift overflow-hidden rounded-[14px] border border-cream/10 bg-ink-2">
      <div className={`${compactCard ? 'p-3.5' : 'p-4'} relative`}>
        <div className="flex items-center gap-2">
          <Avatar seed={tweet.handle} src={tweet.avatar} className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {tweet.name} <span className="font-normal text-mute">@{tweet.handle}</span>
            </p>
          </div>
          <span className="ml-auto text-[11px] text-mute">{timeAgo(tweet.at)}</span>
        </div>
        <p className={`mt-3 leading-6 text-cream/90 ${compactCard ? 'line-clamp-3 text-[14px]' : 'text-[15px]'}`}>
          {tweet.text}
        </p>
        {tweet.reasons?.[0] && !compactCard && (
          <p className="mt-3 text-xs leading-5 text-mute">{tweet.reasons[0]}</p>
        )}
        {factors && !compactCard && (
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-mute">
            <Factor label="Original" value={factors.originality} />
            <Factor label="Engage" value={factors.engagement} />
            <Factor label="Fresh" value={factors.recency} />
            <Factor label="Trust" value={factors.trust} />
          </dl>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-cream/8 bg-ink/40 px-4 py-3">
        <p className="flex items-baseline gap-2 text-sm">
          <span className="font-semibold tabular-nums">{compact(tweet.impressions || tweet.likes || 0)}</span>
          <span className="text-[11px] text-mute">{tweet.impressions ? 'imp' : 'likes'}</span>
        </p>
        {verdict ? (
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${verdictStyle[verdict] || verdictStyle.watch}`}>
            {verdictLabel[verdict] || verdict}
            {typeof tweet.score === 'number' ? ` · ${tweet.score}` : ''}
          </span>
        ) : (
          <span className="text-[11px] text-mute">Unscored</span>
        )}
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-signal hover:underline">
            Open
          </a>
        ) : (
          <span className="text-[11px] font-semibold text-signal">$TWEK</span>
        )}
      </div>
      {onMark && !compactCard && (
        <div className="flex border-t border-cream/8">
          {['pay', 'watch', 'skip'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onMark(tweet.id, v)}
              className={`flex-1 py-2 text-[11px] font-semibold ${
                verdict === v ? verdictStyle[v] : 'text-mute hover:text-cream'
              }`}
            >
              {verdictLabel[v]}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

function Factor({ label, value }) {
  const pct = Math.round((Number(value) || 0) * 100)
  return (
    <div>
      <div className="flex justify-between">
        <dt>{label}</dt>
        <dd className="tabular-nums text-cream/70">{pct}</dd>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-cream/10">
        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
