import { useCallback, useEffect, useState } from 'react'
import { fetchAdmin, lockAdmin, unlockAdmin } from '../lib/api'

export function useAdmin() {
  const [admin, setAdmin] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await fetchAdmin()
      setAdmin(Boolean(data.admin))
      setError('')
    } catch (err) {
      setAdmin(false)
      setError(err.message || 'Could not check dev session.')
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unlock = useCallback(async (key) => {
    await unlockAdmin(key)
    await load()
  }, [load])

  const lock = useCallback(async () => {
    await lockAdmin()
    setAdmin(false)
    setError('')
  }, [])

  return { admin, ready, error, unlock, lock, reload: load }
}
