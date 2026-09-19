export function money(n, digits = 2) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function compact(n) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 1 : 1).replace(/\.0$/, '')}K`
  return String(Math.round(n))
}

export function timeAgo(iso) {
  const at = new Date(iso).getTime()
  if (!Number.isFinite(at)) return '—'
  const delta = Math.max(0, Date.now() - at)
  const m = Math.floor(delta / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function shortCa(ca) {
  return `${ca.slice(0, 4)}…${ca.slice(-4)}`
}
