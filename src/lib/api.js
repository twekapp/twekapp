async function request(path, options) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`)
    err.status = res.status
    err.body = body
    throw err
  }
  return body
}

export function fetchPayouts() {
  return request('/api/payouts')
}

export function sendPayouts(payload) {
  return request('/api/payouts/send', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchTweets(verdict) {
  const q = verdict && verdict !== 'all' ? `?verdict=${encodeURIComponent(verdict)}` : ''
  return request(`/api/tweets${q}`)
}

export function refreshTweets() {
  return request('/api/tweets/refresh', { method: 'POST', body: '{}' })
}

export function registerTweet(payload) {
  return request('/api/tweets/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function analyzeTweet(payload) {
  return request('/api/tweets/analyze', { method: 'POST', body: JSON.stringify(payload) })
}

export function markTweet(id, verdict) {
  return request('/api/tweets/verdict', { method: 'POST', body: JSON.stringify({ id, verdict }) })
}

export function fetchAdmin() {
  return request('/api/admin/me')
}

export function unlockAdmin(key) {
  return request('/api/admin/unlock', { method: 'POST', body: JSON.stringify({ key }) })
}

export function lockAdmin() {
  return request('/api/admin/lock', { method: 'POST', body: '{}' })
}

export function linkUser(payload) {
  return request('/api/users/link', { method: 'POST', body: JSON.stringify(payload) })
}
