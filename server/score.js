const RAID_LINES = [
  'gm $twek',
  'gn $twek',
  'lfg $twek',
  'wagmi $twek',
  '$twek',
  'buy $twek',
  'send it $twek',
]

const CASHTAG = /\$twek\b/i

export function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\$twek|#twek/gi, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(text) {
  return new Set(normalizeText(text).split(' ').filter((w) => w.length > 1))
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 1
  let hit = 0
  for (const w of a) if (b.has(w)) hit += 1
  return hit / (a.size + b.size - hit || 1)
}

function daysSince(iso) {
  if (!iso) return 365
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 86400000)
}

export function scoreTweet(tweet, peers = []) {
  const reasons = []
  const text = tweet.text || ''
  const hasCashtag = CASHTAG.test(text)
  const body = normalizeText(text)
  const words = tokens(text)

  if (!hasCashtag) reasons.push('No $TWEK cashtag')
  if (!body) reasons.push('Empty after stripping the ticker')
  if (body.length < 12) reasons.push('Too thin — basically just the ticker')
  if (/^(gm|gn|lfg|wagmi|moon|pump)(\s|$)/.test(body)) reasons.push('Raid filler (gm/lfg/wagmi)')

  let raidHit = 0
  for (const line of RAID_LINES) {
    raidHit = Math.max(raidHit, jaccard(words, tokens(line)))
  }
  let copyHit = 0
  for (const other of peers) {
    if (other.id === tweet.id) continue
    copyHit = Math.max(copyHit, jaccard(words, tokens(other.text)))
  }
  if (raidHit > 0.72) reasons.push('Matches a raid / template line')
  if (copyHit > 0.78) reasons.push('Near-duplicate of another $TWEK tweet')

  const originality = clamp(1 - Math.max(raidHit * 0.85, copyHit * 0.9, body.length < 12 ? 0.8 : 0), 0.05, 1)

  const likes = num(tweet.likes)
  const replies = num(tweet.replies)
  const retweets = num(tweet.retweets)
  const quotes = num(tweet.quotes)
  const impressions = num(tweet.impressions) || likes * 40 + retweets * 80 + replies * 20 + quotes * 50
  const engaged = likes + replies * 2 + retweets * 3 + quotes * 2
  const engagement = clamp(Math.log10(engaged + 1) / 3.2, 0.04, 1)
  if (engaged < 3) reasons.push('Almost no engagement yet')

  const ageHours = Math.max(0, (Date.now() - new Date(tweet.at || Date.now()).getTime()) / 3600000)
  const recency = clamp(Math.exp(-ageHours / 36), 0.12, 1)
  if (ageHours > 72) reasons.push('Older than three days — pool is for live attention')

  const followers = num(tweet.followers)
  const accountDays = daysSince(tweet.accountCreatedAt)
  const trust = clamp(
    (accountDays > 90 ? 0.35 : accountDays / 90 * 0.35) +
      (followers > 200 ? 0.35 : followers / 200 * 0.35) +
      (tweet.verified ? 0.2 : 0) +
      0.1,
    0.08,
    1,
  )
  if (accountDays < 7 && followers < 30) reasons.push('Brand-new handle with no following')

  const weight = impressions ** 0.6 * originality * engagement * recency * trust
  const score = Math.round(clamp(weight / 40, 0, 1) * 100)

  let verdict = 'watch'
  if (!hasCashtag || originality < 0.22 || reasons.includes('Empty after stripping the ticker')) {
    verdict = 'skip'
  } else if (score >= 42 && originality >= 0.45 && engaged >= 8) {
    verdict = 'pay'
  } else if (score < 18 && (originality < 0.35 || engaged < 2)) {
    verdict = 'skip'
  }

  if (verdict === 'pay') reasons.unshift('Original enough, live engagement, worth a slice')
  if (verdict === 'watch') reasons.unshift('Keep watching — not dust, not a lock')
  if (verdict === 'skip' && hasCashtag && !reasons.some((r) => r.startsWith('Original'))) {
    reasons.unshift('Not worth paying this hour')
  }

  const override = tweet.verdictOverride
  if (override === 'pay' || override === 'watch' || override === 'skip') {
    verdict = override
    reasons.unshift(`Manual mark: ${override}`)
  }

  return {
    ...tweet,
    impressions,
    likes,
    replies,
    retweets,
    quotes,
    score,
    weight: Number(weight.toFixed(3)),
    verdict,
    reasons: unique(reasons).slice(0, 4),
    factors: {
      cashtag: hasCashtag,
      originality: round(originality),
      engagement: round(engagement),
      recency: round(recency),
      trust: round(trust),
    },
  }
}

export function scoreAll(tweets) {
  return tweets.map((tweet) => scoreTweet(tweet, tweets))
}

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function round(n) {
  return Number(n.toFixed(2))
}

function unique(list) {
  return [...new Set(list)]
}
