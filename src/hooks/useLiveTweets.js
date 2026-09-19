import { useCallback, useEffect, useState } from 'react'
import { fetchTweets, refreshTweets } from '../lib/api'

export function useLiveTweets({ pollMs = 30000 } = {}) {
  const [tweets, setTweets] = useState([])
  const [stats, setStats] = useState({ seen: 0, pay: 0, watch: 0, skip: 0 })
  const [configured, setConfigured] = useState(false)
  const [syncedAt, setSyncedAt] = useState(null)
  const [pull, setPull] = useState({ enabled: false, max: 10, everyMinutes: 30, sinceId: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const apply = (data) => {
    setTweets(data.tweets || [])
    setStats(data.stats || { seen: 0, pay: 0, watch: 0, skip: 0 })
    setConfigured(Boolean(data.configured))
    setSyncedAt(data.syncedAt)
    if (data.pull) setPull(data.pull)
    setError('')
  }

  const load = useCallback(async () => {
    try {
      apply(await fetchTweets())
    } catch (err) {
      setError(err.message || 'Could not reach the tweet stream.')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      apply(await refreshTweets())
    } catch (err) {
      setError(err.message || 'Refresh failed.')
      await load()
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    load()
    const id = setInterval(load, pollMs)
    return () => clearInterval(id)
  }, [load, pollMs])

  return { tweets, stats, configured, syncedAt, pull, error, loading, refresh, reload: load }
}
