import { xBearer } from './env.js'

const API = 'https://api.twitter.com/2'

export function parseTweetId(input) {
  const text = String(input || '').trim()
  if (/^\d{5,}$/.test(text)) return text
  const match = text.match(/(?:x\.com|twitter\.com)\/(?:\w+|i\/web)\/status\/(\d+)/i)
  return match?.[1] || null
}

export function tweetUrl(handle, id) {
  return `https://x.com/${handle || 'i/web'}/status/${id}`
}

function headers() {
  const token = xBearer()
  if (!token) {
    const err = new Error('X_BEARER_TOKEN is missing. Add an X API v2 app-only bearer to .env.local.')
    err.code = 'NO_TOKEN'
    throw err
  }
  return { Authorization: `Bearer ${token}` }
}

async function xGet(path) {
  const res = await fetch(`${API}${path}`, { headers: headers() })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = body?.detail || body?.title || res.statusText
    const err = new Error(detail || `X API ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return body
}

function mapUser(user) {
  return {
    name: user?.name || user?.username || 'Unknown',
    handle: user?.username || 'unknown',
    avatar: user?.profile_image_url || null,
    followers: user?.public_metrics?.followers_count || 0,
    accountCreatedAt: user?.created_at || null,
    verified: Boolean(user?.verified || user?.verified_type),
  }
}

function mapTweet(tweet, user) {
  const metrics = tweet.public_metrics || {}
  return {
    id: tweet.id,
    text: tweet.text || '',
    at: tweet.created_at || new Date().toISOString(),
    likes: metrics.like_count || 0,
    replies: metrics.reply_count || 0,
    retweets: metrics.retweet_count || 0,
    quotes: metrics.quote_count || 0,
    impressions: metrics.impression_count || 0,
    url: tweetUrl(user.handle, tweet.id),
    firstSeen: new Date().toISOString(),
    source: 'x',
    ...user,
  }
}

function usersById(includes) {
  const map = new Map()
  for (const user of includes?.users || []) map.set(user.id, mapUser(user))
  return map
}

const FIELDS =
  'tweet.fields=created_at,public_metrics,lang,text,author_id,conversation_id' +
  '&expansions=author_id' +
  '&user.fields=username,name,created_at,public_metrics,verified,verified_type,profile_image_url'

export async function searchTweets({ query, max = 10, sinceId } = {}) {
  const q = query || '$TWEK -is:retweet'
  const count = Math.min(100, Math.max(10, Number(max) || 10))
  let path = `/tweets/search/recent?query=${encodeURIComponent(q)}&max_results=${count}&${FIELDS}`
  if (sinceId) path += `&since_id=${encodeURIComponent(sinceId)}`
  const data = await xGet(path)
  const users = usersById(data.includes)
  return (data.data || []).map((tweet) => mapTweet(tweet, users.get(tweet.author_id) || mapUser()))
}

export async function lookupTweet(id) {
  const data = await xGet(`/tweets/${id}?${FIELDS}`)
  if (!data.data) return null
  const users = usersById(data.includes)
  return mapTweet(data.data, users.get(data.data.author_id) || mapUser())
}
