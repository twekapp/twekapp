import { createHmac, timingSafeEqual } from 'node:crypto'
import { loadEnv } from './env.js'

loadEnv()

const COOKIE = process.env.RYIOT_ADMIN_KEY ? 'ryiot_admin' : 'twek_admin'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

export function adminKey() {
  return (process.env.RYIOT_ADMIN_KEY || process.env.TWEK_ADMIN_KEY || '').trim()
}

export function adminConfigured() {
  return Boolean(adminKey())
}

function hmac(value) {
  return createHmac('sha256', adminKey()).update(String(value)).digest('hex')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function parseCookies(header) {
  const out = {}
  for (const part of String(header || '').split(';')) {
    const cut = part.indexOf('=')
    if (cut < 1) continue
    out[part.slice(0, cut).trim()] = decodeURIComponent(part.slice(cut + 1).trim())
  }
  return out
}

export function isAdminRequest(req) {
  if (!adminConfigured()) return false
  const token = parseCookies(req.headers.cookie)[COOKIE]
  if (!token) return false
  const cut = token.lastIndexOf('.')
  if (cut < 1) return false
  const exp = token.slice(0, cut)
  const sig = token.slice(cut + 1)
  if (!safeEqual(sig, hmac(exp))) return false
  return Number(exp) > Date.now()
}

export function keyMatches(key) {
  return adminConfigured() && safeEqual(key || '', adminKey())
}

export function adminCookieHeader(token, maxAgeSec) {
  const parts = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ]
  if (process.env.RYIOT_COOKIE_SECURE === '1' || process.env.TWEK_COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }
  return parts.join('; ')
}

export function issueAdminCookie() {
  const exp = Date.now() + TTL_MS
  const token = `${exp}.${hmac(exp)}`
  return {
    token,
    header: adminCookieHeader(token, Math.floor(TTL_MS / 1000)),
  }
}

export function clearAdminCookie() {
  return adminCookieHeader('', 0)
}
