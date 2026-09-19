import { scoreAll } from './score.js'
import {
  getMeta,
  knownIds,
  listTweets,
  newestNumericId,
  syncPayout,
  saveScore,
  setMeta,
  setOverride,
  upsertTweetRow,
} from './db.js'

export async function loadStore() {
  const tweets = await listTweets()
  return {
    tweets,
    syncedAt: await getMeta('syncedAt'),
    newestId: (await getMeta('newestId')) || (await newestNumericId()),
    lastPullAt: await getMeta('lastPullAt'),
  }
}

async function persistPipeline(tweets) {
  const scored = scoreAll(tweets)
  for (const tweet of scored) {
    await saveScore(tweet)
    await syncPayout(tweet)
  }
  return scored
}

export async function upsertTweets(incoming) {
  for (const tweet of incoming) await upsertTweetRow(tweet)
  const store = await loadStore()
  await persistPipeline(store.tweets)
  const now = new Date().toISOString()
  await setMeta('syncedAt', now)
  await setMeta('lastPullAt', now)
  await setMeta('newestId', await newestNumericId())
  return loadStore()
}

export async function setVerdict(id, verdict) {
  if (!(await setOverride(id, verdict))) return null
  const store = await loadStore()
  await persistPipeline(store.tweets)
  return loadStore()
}

export async function touchPull() {
  await setMeta('lastPullAt', new Date().toISOString())
  return loadStore()
}

export async function existingIds() {
  return knownIds()
}
