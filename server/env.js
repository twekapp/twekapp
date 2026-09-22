import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function parseEnv(text) {
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const cut = line.indexOf('=')
    if (cut < 1) continue
    const key = line.slice(0, cut).trim()
    let value = line.slice(cut + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null) process.env[key] = value
  }
}

export function loadEnv() {
  const root = resolve(import.meta.dirname, '..')
  for (const name of ['.env.local', '.env']) {
    const file = resolve(root, name)
    if (existsSync(file)) parseEnv(readFileSync(file, 'utf8'))
  }
}

export function xBearer() {
  const raw = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN || ''
  if (!raw) return ''
  try {
    return raw.includes('%') ? decodeURIComponent(raw) : raw
  } catch {
    return raw
  }
}

export function supabaseUrl() {
  return (process.env.SUPABASE_URL || '').trim()
}

export function supabaseServiceKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
}

export function supabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseServiceKey())
}

export function poolUsd() {
  const n = Number(process.env.RYIOT_POOL_USD || process.env.TWEK_POOL_USD || 50)
  return Number.isFinite(n) && n > 0 ? n : 50
}

export function xPullEnabled() {
  const v = String(process.env.X_PULL ?? '1').trim().toLowerCase()
  if (v === 'off' || v === 'false' || v === 'pause') return false
  return true
}

loadEnv()
