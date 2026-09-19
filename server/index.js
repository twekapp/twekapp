import { createServer } from 'node:http'
import {
  adminConfigured,
  clearAdminCookie,
  isAdminRequest,
  issueAdminCookie,
  keyMatches,
} from './admin.js'
import {
  bootDatabase,
  isSolanaAddress,
  linkWallet,
  listPayoutsDetailed,
  markPayoutSent,
  payoutStats,
} from './db.js'
import { loadEnv, poolUsd, supabaseConfigured, xBearer, xPullEnabled } from './env.js'
import { scoreAll, scoreTweet } from './score.js'
import { existingIds, loadStore, setVerdict, touchPull, upsertTweets } from './store.js'
import { lookupTweet, parseTweetId, searchTweets } from './x.js'

loadEnv()

const PORT = Number(process.env.API_PORT || 8787)
const PULL_MAX = Math.max(10, Number(process.env.X_PULL_MAX || 10))
const PULL_MINUTES = Math.max(10, Number(process.env.X_PULL_MINUTES || 30))
const MANUAL_COOLDOWN_MS = 90_000

function send(res, status, body, extraHeaders = {}) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
    ...extraHeaders,
  })
  res.end(json)
}

function denyDev(res) {
  return send(res, 401, { error: 'Dev only. Unlock Board with TWEK_ADMIN_KEY.' })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > 64_000) {
        const err = new Error('Body too large')
        err.status = 413
        reject(err)
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function publicTweet(tweet) {
  const { wallet, ...rest } = tweet
  return rest
}

function publicPayout(payout, admin) {
  if (admin) return payout
  return {
    ...payout,
    wallet: undefined,
    hasWallet: Boolean(payout.wallet),
  }
}

function configured() {
  return Boolean(xBearer())
}

function withScores(store, extra = {}) {
  const tweets = scoreAll(store.tweets)
  return {
    configured: configured(),
    syncedAt: store.syncedAt,
    newestId: store.newestId,
    lastPullAt: store.lastPullAt,
    pull: {
      enabled: xPullEnabled(),
      max: PULL_MAX,
      everyMinutes: PULL_MINUTES,
      sinceId: Boolean(store.newestId),
    },
    tweets,
    stats: {
      seen: tweets.length,
      pay: tweets.filter((t) => t.verdict === 'pay').length,
      watch: tweets.filter((t) => t.verdict === 'watch').length,
      skip: tweets.filter((t) => t.verdict === 'skip').length,
    },
    ...extra,
  }
}

async function persistAfterLink(handle) {
  const store = await loadStore()
  const mine = store.tweets.filter((t) => t.handle === String(handle || '').replace(/^@/, ''))
  if (mine.length) await upsertTweets(mine)
}

function pulledAgo(store) {
  if (!store.lastPullAt) return Infinity
  return Date.now() - new Date(store.lastPullAt).getTime()
}

async function refresh({ query, mode = 'manual' } = {}) {
  if (!configured()) {
    const err = new Error('X_BEARER_TOKEN is missing')
    err.code = 'NO_TOKEN'
    throw err
  }
  if (!xPullEnabled()) {
    return withScores(await loadStore(), { pulled: 0, skipped: 'paused' })
  }

  const store = await loadStore()
  if (mode === 'auto' && !store.newestId) {
    return withScores(store, { pulled: 0, skipped: 'waiting for first manual pull' })
  }
  const wait = mode === 'auto' ? PULL_MINUTES * 60_000 : MANUAL_COOLDOWN_MS
  if (pulledAgo(store) < wait) {
    return withScores(store, { pulled: 0, skipped: 'cooldown' })
  }

  const found = await searchTweets({
    query,
    max: PULL_MAX,
    sinceId: store.newestId,
  })
  const known = await existingIds()
  const fresh = found.filter((t) => !known.has(t.id))
  const next = fresh.length ? await upsertTweets(fresh) : await touchPull()
  console.log(`X pull ${mode}: ${fresh.length} new / ${found.length} returned`)
  return withScores(next, { pulled: fresh.length })
}

export async function handleApi(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname

  try {
    if (req.method === 'GET' && path === '/api/admin/me') {
      return send(res, 200, { admin: isAdminRequest(req), configured: adminConfigured() })
    }

    if (req.method === 'POST' && path === '/api/admin/unlock') {
      const body = await readBody(req)
      if (!keyMatches(body.key)) return send(res, 401, { error: 'Wrong dev key.' })
      const { header } = issueAdminCookie()
      return send(res, 200, { admin: true }, { 'Set-Cookie': header })
    }

    if (req.method === 'POST' && path === '/api/admin/lock') {
      return send(res, 200, { admin: false }, { 'Set-Cookie': clearAdminCookie() })
    }

    if (req.method === 'GET' && path === '/api/health') {
      const db = await bootDatabase()
      if (!db.ok) {
        return send(res, 200, {
          ok: false,
          configured: configured(),
          db: db.db,
          error: db.error,
        })
      }
      const store = await loadStore()
      return send(res, 200, {
        ok: true,
        configured: configured(),
        db: 'supabase',
        tweets: store.tweets.length,
        payouts: await payoutStats(),
      })
    }

    if (req.method === 'GET' && path === '/api/payouts') {
      const pool = poolUsd()
      const admin = isAdminRequest(req)
      const payouts = await listPayoutsDetailed(pool)
      const payable = payouts
        .filter((p) => p.status === 'queued' && !p.dust)
        .reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0)
      return send(res, 200, {
        payouts: payouts.map((p) => publicPayout(p, admin)),
        stats: await payoutStats(),
        pool,
        payable: Number(payable.toFixed(2)),
      })
    }

    if (req.method === 'POST' && path === '/api/payouts/send') {
      if (!isAdminRequest(req)) return denyDev(res)
      const body = await readBody(req)
      const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : []
      if (!ids.length) return send(res, 400, { error: 'Need a payout id.' })
      const pool = poolUsd()
      const detailed = await listPayoutsDetailed(pool)
      const sent = []
      for (const id of ids) {
        const preview = detailed.find((p) => p.id === id)
        sent.push(
          await markPayoutSent(id, {
            tx: ids.length === 1 ? body.tx : undefined,
            amount: ids.length === 1 ? body.amount ?? preview?.amount_usd : preview?.amount_usd,
          }),
        )
      }
      const payouts = await listPayoutsDetailed(pool)
      return send(res, 200, { sent, payouts, stats: await payoutStats(), pool })
    }

    if (req.method === 'POST' && path === '/api/users/link') {
      const body = await readBody(req)
      if (!isSolanaAddress(body.wallet)) {
        return send(res, 400, { error: 'Need a Solana wallet address.' })
      }
      const user = await linkWallet(body.handle, body.wallet, {
        overwrite: isAdminRequest(req),
      })
      if (!user) return send(res, 400, { error: 'Need handle and wallet.' })
      await persistAfterLink(body.handle)
      return send(res, 200, { user, payouts: await payoutStats() })
    }

    if (req.method === 'GET' && path === '/api/tweets') {
      const payload = withScores(await loadStore())
      const verdict = url.searchParams.get('verdict')
      if (verdict && verdict !== 'all') {
        payload.tweets = payload.tweets.filter((t) => t.verdict === verdict)
      }
      if (!isAdminRequest(req)) {
        payload.tweets = payload.tweets.map(publicTweet)
      }
      return send(res, 200, payload)
    }

    if (req.method === 'POST' && path === '/api/tweets/refresh') {
      if (!isAdminRequest(req)) return denyDev(res)
      const body = await readBody(req).catch(() => ({}))
      return send(res, 200, await refresh({ query: body.query, mode: 'manual' }))
    }

    if (req.method === 'POST' && path === '/api/tweets/analyze') {
      if (!isAdminRequest(req)) return denyDev(res)
      const body = await readBody(req)
      const text = String(body.text || '').trim()
      if (!text) return send(res, 400, { error: 'Paste the tweet text.' })
      const handle = String(body.handle || 'unknown').replace(/^@/, '')
      if (body.wallet) await linkWallet(handle, body.wallet)
      const draft = {
        id: body.id || `paste-${Date.now()}`,
        text,
        handle,
        name: body.name || handle,
        at: body.at || new Date().toISOString(),
        likes: Number(body.likes) || 0,
        replies: Number(body.replies) || 0,
        retweets: Number(body.retweets) || 0,
        quotes: Number(body.quotes) || 0,
        impressions: Number(body.impressions) || 0,
        followers: Number(body.followers) || 0,
        source: 'paste',
        firstSeen: new Date().toISOString(),
        url: body.url || '',
      }
      const store = body.save === false ? await loadStore() : await upsertTweets([draft])
      const scored = scoreTweet(
        store.tweets.find((t) => t.id === draft.id) || draft,
        store.tweets,
      )
      return send(res, 200, { tweet: scored, ...withScores(store) })
    }

    if (req.method === 'POST' && path === '/api/tweets/verdict') {
      if (!isAdminRequest(req)) return denyDev(res)
      const body = await readBody(req)
      if (!['pay', 'watch', 'skip'].includes(body.verdict)) {
        return send(res, 400, { error: 'verdict must be pay, watch, or skip' })
      }
      const store = await setVerdict(String(body.id || ''), body.verdict)
      if (!store) return send(res, 404, { error: 'Tweet not on the board yet.' })
      const scored = scoreTweet(
        store.tweets.find((t) => t.id === body.id),
        store.tweets,
      )
      return send(res, 200, { tweet: scored, ...withScores(store) })
    }

    if (req.method === 'POST' && path === '/api/tweets/register') {
      const body = await readBody(req)
      if (!xPullEnabled()) {
        return send(res, 503, {
          error: 'X search is paused until launch. Tweets are not looked up and credits are not spent.',
        })
      }
      if (!configured()) {
        return send(res, 400, {
          error: 'Add X_BEARER_TOKEN to .env.local. That is the X API v2 app-only bearer, not the Privy Twitter login.',
        })
      }

      const id = parseTweetId(body.url || body.id)
      if (!id) {
        return send(res, 400, { error: 'Paste the x.com/status URL. We do not guess the tweet.' })
      }
      const tweet = await lookupTweet(id)
      if (!tweet) {
        return send(res, 404, { error: 'Tweet not found yet. Paste the x.com/status URL a minute after you post.' })
      }
      const claimed = String(body.handle || '').replace(/^@/, '').toLowerCase()
      if (claimed && tweet.handle.toLowerCase() !== claimed) {
        return send(res, 403, { error: 'That tweet is not from the linked X handle.' })
      }
      if (body.wallet && tweet.handle && (!claimed || tweet.handle.toLowerCase() === claimed)) {
        try {
          await linkWallet(tweet.handle, body.wallet)
        } catch (err) {
          if (err.status !== 409) throw err
        }
      }
      const store = await upsertTweets([tweet])
      const scored = scoreTweet(
        store.tweets.find((t) => t.id === tweet.id),
        store.tweets,
      )
      return send(res, 200, { tweet: scored, ...withScores(store) })
    }

    send(res, 404, { error: 'Not found' })
  } catch (err) {
    const status =
      err.status ||
      (err.code === 'NO_TOKEN' || err.code === 'NO_SUPABASE' ? 400 : 500)
    send(res, status, { error: err.message || 'Server error' })
  }
}

if (!process.env.VERCEL) {
  const server = createServer(handleApi)
  const dbStatus = await bootDatabase()

  server.listen(PORT, () => {
    console.log(
      `TWEK api http://localhost:${PORT}  x=${configured() ? 'on' : 'missing X_BEARER_TOKEN'}  db=${dbStatus.db}`,
    )
    if (!dbStatus.ok) console.warn(dbStatus.error)
  })

  if (xPullEnabled() && configured() && supabaseConfigured() && dbStatus.ok) {
    setInterval(() => {
      refresh({ mode: 'auto' }).catch((err) => console.warn('X pull failed:', err.message))
    }, PULL_MINUTES * 60_000)
    console.log(`X pull: manual first, then every ${PULL_MINUTES}m, max ${PULL_MAX}, since_id on`)
  } else {
    console.log('X pull: paused (X_PULL=0). Search and lookups are off. Credits stay put.')
  }
}
