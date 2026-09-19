export function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''))
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    // ignore
  }
  return null
}

export function safeAvatarUrl(src) {
  const href = safeHttpUrl(src)
  if (!href) return null
  try {
    const host = new URL(href).hostname
    if (host === 'pbs.twimg.com' || host === 'abs.twimg.com' || host.endsWith('.twimg.com')) {
      return href
    }
  } catch {
    // ignore
  }
  return null
}
