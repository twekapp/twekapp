import { useCallback, useEffect, useState } from 'react'
import { fetchPayouts } from '../lib/api'

const emptyStats = { total: 0, queued: 0, blocked: 0, sent: 0 }

export function useLivePayouts({ pollMs = 30000 } = {}) {
  const [payouts, setPayouts] = useState([])
  const [stats, setStats] = useState(emptyStats)
  const [pool, setPool] = useState(50)
  const [payable, setPayable] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchPayouts()
      setPayouts(data.payouts || [])
      setStats(data.stats || emptyStats)
      setPool(Number(data.pool) || 50)
      setPayable(Number(data.payable) || 0)
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load payouts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, pollMs)
    return () => clearInterval(id)
  }, [load, pollMs])

  return { payouts, stats, pool, payable, error, loading, reload: load }
}
