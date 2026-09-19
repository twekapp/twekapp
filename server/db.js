import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadEnv, supabaseConfigured, supabaseServiceKey, supabaseUrl } from './env.js'

loadEnv()

const sqliteFile = resolve(import.meta.dirname, 'data', 'twek.db')

let client

function missingSupabase() {
  const err = new Error('Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local')
  err.code = 'NO_SUPABASE'
  return err
}

function wrap(error) {
  const message = error?.message || 'Supabase error'
  const missingTable = /schema cache|does not exist|PGRST205|42P01/i.test(message)
  const err = new Error(
    missingTable
      ? 'Supabase tables are missing. Run supabase/schema.sql in the SQL editor.'
      : message,
  )
  err.cause = error
  return err
}

export function getClient() {
  if (!supabaseConfigured()) throw missingSupabase()
  if (!client) {
    client = createClient(supabaseUrl(), supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

async function run(query) {
  const { data, error } = await query
  if (error) throw wrap(error)
  return data
}

export async function getMeta(key) {
  const row = await run(
    getClient().from('meta').select('value').eq('key', key).maybeSingle(),
  )
  return row?.value ?? null
}

export async function setMeta(key, value) {
  await run(
    getClient()
      .from('meta')
      .upsert({ key, value: value == null ? null : String(value) }),
  )
}

export async function upsertUser(user) {
  const handle = String(user.handle || 'unknown').replace(/^@/, '')
  const prev = await run(
    getClient().from('users').select('*').eq('handle', handle).maybeSingle(),
  )
  await run(
    getClient()
      .from('users')
      .upsert({
        handle,
        name: user.name || prev?.name || handle,
        avatar: user.avatar || prev?.avatar || null,
        followers: Number(user.followers ?? prev?.followers) || 0,
        account_created_at: user.accountCreatedAt || prev?.account_created_at || null,
        verified: Boolean(user.verified || prev?.verified),
        wallet: user.wallet || prev?.wallet || null,
        linked_at:
          user.wallet && !prev?.wallet ? new Date().toISOString() : prev?.linked_at || null,
      }),
  )
  return handle
}

export function isSolanaAddress(wallet) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(wallet || '').trim())
}

export async function linkWallet(handle, wallet, { overwrite = false } = {}) {
  const clean = String(handle || '').replace(/^@/, '').trim()
  const next = String(wallet || '').trim()
  if (!clean || !isSolanaAddress(next)) return null
  const prev = await getUser(clean)
  if (prev?.wallet && prev.wallet !== next && !overwrite) {
    const err = new Error('This handle already has a wallet. Dev can override.')
    err.status = 409
    throw err
  }
  await upsertUser({ handle: clean, wallet: next })
  await run(
    getClient()
      .from('users')
      .update({ wallet: next, linked_at: new Date().toISOString() })
      .eq('handle', clean),
  )
  await run(
    getClient()
      .from('payouts')
      .update({
        wallet: next,
        status: 'queued',
        reason: 'Wallet linked. Waiting for Dev wallet send.',
      })
      .eq('handle', clean)
      .in('status', ['queued', 'blocked']),
  )
  return run(getClient().from('users').select('*').eq('handle', clean).maybeSingle())
}

export async function getUser(handle) {
  return run(
    getClient()
      .from('users')
      .select('*')
      .eq('handle', String(handle || '').replace(/^@/, ''))
      .maybeSingle(),
  )
}

export async function upsertTweetRow(tweet) {
  const handle = await upsertUser(tweet)
  const prev = await run(
    getClient().from('tweets').select('*').eq('id', tweet.id).maybeSingle(),
  )
  await run(
    getClient()
      .from('tweets')
      .upsert({
        id: tweet.id,
        handle,
        text: tweet.text || '',
        url: tweet.url || prev?.url || '',
        posted_at: tweet.at || prev?.posted_at || new Date().toISOString(),
        first_seen: prev?.first_seen || tweet.firstSeen || new Date().toISOString(),
        source: tweet.source || prev?.source || 'x',
        likes: Number(tweet.likes) || 0,
        replies: Number(tweet.replies) || 0,
        retweets: Number(tweet.retweets) || 0,
        quotes: Number(tweet.quotes) || 0,
        impressions: Number(tweet.impressions) || 0,
        verdict_override: tweet.verdictOverride || prev?.verdict_override || null,
      }),
  )
}

function rowToTweet(row) {
  const user = row.users || {}
  return {
    id: row.id,
    handle: row.handle,
    name: user.name || row.handle,
    avatar: user.avatar || null,
    followers: user.followers || 0,
    accountCreatedAt: user.account_created_at || null,
    verified: Boolean(user.verified),
    wallet: user.wallet || null,
    text: row.text,
    url: row.url,
    at: row.posted_at,
    firstSeen: row.first_seen,
    source: row.source,
    likes: row.likes,
    replies: row.replies,
    retweets: row.retweets,
    quotes: row.quotes,
    impressions: row.impressions,
    verdictOverride: row.verdict_override || null,
  }
}

export async function listTweets() {
  const rows = await run(
    getClient()
      .from('tweets')
      .select('*, users(*)')
      .order('posted_at', { ascending: false, nullsFirst: false })
      .limit(400),
  )
  return (rows || []).map(rowToTweet)
}

export async function newestNumericId() {
  const rows = await run(getClient().from('tweets').select('id'))
  let newest = null
  for (const row of rows || []) {
    if (!/^\d+$/.test(String(row.id))) continue
    if (!newest || BigInt(row.id) > BigInt(newest)) newest = row.id
  }
  return newest
}

export async function knownIds() {
  const rows = await run(getClient().from('tweets').select('id'))
  return new Set((rows || []).map((row) => row.id))
}

export async function saveScore(tweet) {
  await run(
    getClient()
      .from('scores')
      .upsert({
        tweet_id: tweet.id,
        verdict: tweet.verdict,
        score: tweet.score,
        weight: tweet.weight,
        reasons: tweet.reasons || [],
        factors: tweet.factors || {},
        scored_at: new Date().toISOString(),
      }),
  )
}

export async function setOverride(id, verdict) {
  const row = await run(
    getClient().from('tweets').select('id').eq('id', id).maybeSingle(),
  )
  if (!row) return false
  await run(getClient().from('tweets').update({ verdict_override: verdict }).eq('id', id))
  return true
}

export async function syncPayout(tweet) {
  if (tweet.verdict === 'pay') return queuePayout(tweet)
  await run(
    getClient()
      .from('payouts')
      .update({
        status: 'cancelled',
        amount_usd: 0,
        reason: 'No longer worth paying.',
      })
      .eq('tweet_id', tweet.id)
      .in('status', ['queued', 'blocked']),
  )
  return null
}

export async function queuePayout(tweet) {
  if (tweet.verdict !== 'pay') return null
  const existing = await run(
    getClient().from('payouts').select('*').eq('tweet_id', tweet.id).maybeSingle(),
  )
  if (existing) {
    if (existing.status === 'cancelled') {
      const user = await getUser(tweet.handle)
      const wallet = user?.wallet || tweet.wallet || existing.wallet || null
      await run(
        getClient()
          .from('payouts')
          .update({
            wallet,
            amount_usd: 0,
            status: wallet ? 'queued' : 'blocked',
            reason: wallet
              ? 'Scored as worth paying. Waiting for Dev wallet send.'
              : 'Worth paying, but no wallet is linked to this handle.',
          })
          .eq('id', existing.id),
      )
      return run(getClient().from('payouts').select('*').eq('id', existing.id).maybeSingle())
    }
    return existing
  }
  const user = await getUser(tweet.handle)
  const wallet = user?.wallet || tweet.wallet || null
  const row = {
    id: `pay-${tweet.id}`,
    tweet_id: tweet.id,
    handle: tweet.handle,
    wallet,
    amount_usd: 0,
    status: wallet ? 'queued' : 'blocked',
    reason: wallet
      ? 'Scored as worth paying. Waiting for Dev wallet send.'
      : 'Worth paying, but no wallet is linked to this handle.',
    created_at: new Date().toISOString(),
  }
  await run(getClient().from('payouts').insert(row))
  return row
}

export async function listPayouts() {
  const open = await run(
    getClient()
      .from('payouts')
      .select('*')
      .in('status', ['queued', 'blocked'])
      .order('created_at', { ascending: false }),
  )
  const closed = await run(
    getClient()
      .from('payouts')
      .select('*')
      .in('status', ['sent', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(200),
  )
  const seen = new Set()
  const rows = []
  for (const row of [...(open || []), ...(closed || [])]) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    rows.push(row)
  }
  rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  return rows
}

export async function listPayoutsDetailed(pool) {
  const payouts = await listPayouts()
  const ids = [...new Set(payouts.map((p) => p.tweet_id).filter(Boolean))]
  const tweets = ids.length
    ? (await run(getClient().from('tweets').select('id, text, url').in('id', ids))) || []
    : []
  const scores = ids.length
    ? (await run(getClient().from('scores').select('tweet_id, weight, score').in('tweet_id', ids))) || []
    : []
  const tweetMap = Object.fromEntries(tweets.map((t) => [t.id, t]))
  const scoreMap = Object.fromEntries(scores.map((s) => [s.tweet_id, s]))
  const queued = payouts.filter((p) => p.status === 'queued')
  const weightSum = queued.reduce((sum, p) => {
    const weight = Number(scoreMap[p.tweet_id]?.weight)
    return sum + (Number.isFinite(weight) && weight > 0 ? weight : 0.01)
  }, 0)

  return payouts.map((p) => {
    const score = scoreMap[p.tweet_id]
    const tweet = tweetMap[p.tweet_id]
    const weight = Number(score?.weight)
    const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 0.01
    let amount = Number(p.amount_usd) || 0
    let dust = false
    if (p.status === 'queued') {
      const raw = Number(pool) * (safeWeight / (weightSum || 1))
      dust = raw < 0.5
      amount = dust ? 0 : Number(raw.toFixed(2))
    }
    return {
      ...p,
      amount_usd: amount,
      dust,
      weight: Number.isFinite(weight) ? weight : 0,
      score: score?.score || 0,
      text: tweet?.text || '',
      url: tweet?.url || '',
    }
  })
}

export async function markPayoutSent(id, { tx, amount } = {}) {
  const row = await run(getClient().from('payouts').select('*').eq('id', id).maybeSingle())
  if (!row) {
    const err = new Error('Payout not in the queue.')
    err.status = 404
    throw err
  }
  if (row.status === 'sent') return row
  if (row.status !== 'queued') {
    const err = new Error('Only queued payouts can be marked paid.')
    err.status = 400
    throw err
  }
  if (!row.wallet) {
    const err = new Error('Link a wallet before paying this handle.')
    err.status = 400
    throw err
  }
  const usd = Number(amount)
  const nextAmount = Number.isFinite(usd) && usd > 0 ? Number(usd.toFixed(2)) : Number(row.amount_usd) || 0
  if (nextAmount < 0.5) {
    const err = new Error('Dust under $0.50 is skipped.')
    err.status = 400
    throw err
  }
  await run(
    getClient()
      .from('payouts')
      .update({
        status: 'sent',
        amount_usd: nextAmount,
        tx: tx ? String(tx).trim() : row.tx,
        sent_at: new Date().toISOString(),
        reason: 'Paid from the Dev wallet.',
      })
      .eq('id', id),
  )
  return run(getClient().from('payouts').select('*').eq('id', id).maybeSingle())
}

export async function payoutStats() {
  const rows = await run(getClient().from('payouts').select('status'))
  const stats = { total: 0, queued: 0, blocked: 0, sent: 0, cancelled: 0 }
  for (const row of rows || []) {
    stats.total += 1
    if (row.status === 'queued') stats.queued += 1
    if (row.status === 'blocked') stats.blocked += 1
    if (row.status === 'sent') stats.sent += 1
    if (row.status === 'cancelled') stats.cancelled += 1
  }
  return stats
}

function parseJson(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function migrateFromSqlite() {
  if ((await getMeta('migrated_sqlite')) === '1' || !existsSync(sqliteFile)) return 0
  const { DatabaseSync } = await import('node:sqlite')
  const local = new DatabaseSync(sqliteFile)
  try {
    const users = local.prepare('SELECT * FROM users').all()
    for (const user of users) {
      await run(
        getClient()
          .from('users')
          .upsert({
            handle: user.handle,
            name: user.name,
            avatar: user.avatar,
            followers: user.followers || 0,
            account_created_at: user.account_created_at,
            verified: Boolean(user.verified),
            wallet: user.wallet,
            linked_at: user.linked_at,
          }),
      )
    }

    const tweets = local.prepare('SELECT * FROM tweets').all()
    for (const tweet of tweets) {
      await run(
        getClient()
          .from('tweets')
          .upsert({
            id: tweet.id,
            handle: tweet.handle,
            text: tweet.text,
            url: tweet.url,
            posted_at: tweet.posted_at,
            first_seen: tweet.first_seen,
            source: tweet.source,
            likes: tweet.likes || 0,
            replies: tweet.replies || 0,
            retweets: tweet.retweets || 0,
            quotes: tweet.quotes || 0,
            impressions: tweet.impressions || 0,
            verdict_override: tweet.verdict_override,
          }),
      )
    }

    const scores = local.prepare('SELECT * FROM scores').all()
    for (const score of scores) {
      await run(
        getClient()
          .from('scores')
          .upsert({
            tweet_id: score.tweet_id,
            verdict: score.verdict,
            score: score.score,
            weight: score.weight,
            reasons: parseJson(score.reasons, []),
            factors: parseJson(score.factors, {}),
            scored_at: score.scored_at,
          }),
      )
    }

    const payouts = local.prepare('SELECT * FROM payouts').all()
    for (const payout of payouts) {
      await run(
        getClient()
          .from('payouts')
          .upsert({
            id: payout.id,
            tweet_id: payout.tweet_id,
            handle: payout.handle,
            wallet: payout.wallet,
            amount_usd: payout.amount_usd || 0,
            status: payout.status,
            reason: payout.reason,
            created_at: payout.created_at,
            sent_at: payout.sent_at,
            tx: payout.tx,
          }),
      )
    }

    const meta = local.prepare('SELECT * FROM meta').all()
    for (const row of meta) {
      if (row.key === 'migrated_json' || row.key === 'migrated_sqlite') continue
      await setMeta(row.key, row.value)
    }
    await setMeta('migrated_sqlite', '1')
    console.log(`migrated ${tweets.length} tweets from sqlite → supabase`)
    return tweets.length
  } finally {
    local.close()
  }
}

export async function bootDatabase() {
  if (!supabaseConfigured()) {
    return {
      ok: false,
      db: 'missing',
      error: 'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local',
    }
  }

  const { error } = await getClient().from('meta').select('key').limit(1)
  if (error) {
    return { ok: false, db: 'supabase', error: wrap(error).message }
  }

  try {
    const migrated = await migrateFromSqlite()
    return { ok: true, db: 'supabase', migrated }
  } catch (err) {
    return { ok: false, db: 'supabase', error: err.message }
  }
}
