import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'

export function WalletButton({ className = '', compact = false, menuSide = 'left' }) {
  const { configured, ready, authenticated, shortAddress, xHandle, login, logout, linkX } =
    useAuth()
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const menuPos = menuSide === 'right' ? 'left-[calc(100%+8px)] bottom-0' : 'right-0 top-[calc(100%+8px)]'

  useEffect(() => {
    function onDoc(e) {
      if (!wrap.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (!configured) {
    return <UnconfiguredButton className={className} compact={compact} />
  }

  if (!ready) {
    return (
      <button
        type="button"
        disabled
        className={compact ? `grid h-10 w-full place-items-center opacity-50 ${className}` : `btn btn-ghost opacity-50 ${className}`}
      >
        {compact ? <WalletGlyph /> : 'Connecting'}
      </button>
    )
  }

  if (!authenticated && !shortAddress) {
    return (
      <button
        type="button"
        onClick={login}
        title="Connect wallet"
        aria-label="Connect wallet"
        className={compact ? `grid h-10 w-full place-items-center rounded-xl bg-signal text-ink ${className}` : `btn btn-signal ${className}`}
      >
        {compact ? <WalletGlyph /> : 'Connect wallet'}
      </button>
    )
  }

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={shortAddress || 'Connected'}
        aria-label={shortAddress ? `Wallet ${shortAddress}` : 'Wallet menu'}
        className={compact ? 'grid h-10 w-full place-items-center rounded-xl border border-cream/12' : 'btn btn-ghost'}
      >
        {compact ? (
          <span className="h-2 w-2 rounded-full bg-gold" />
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {shortAddress || 'Connected'}
          </>
        )}
      </button>
      {open && (
        <div className={`pop-in absolute z-50 w-56 overflow-hidden rounded-xl border border-cream/10 bg-ink-2 shadow-xl ${menuPos}`}>
          <div className="border-b border-cream/10 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-mute">Wallet</p>
            <p className="mt-1 font-mono text-sm">{shortAddress}</p>
            {xHandle ? (
              <p className="mt-1 text-sm text-gold">@{xHandle}</p>
            ) : (
              <button type="button" onClick={linkX} className="mt-2 text-sm text-signal hover:underline">
                Link X account
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="w-full px-3 py-2.5 text-left text-sm text-cream/80 hover:bg-cream/5"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M16 14.5h2" />
    </svg>
  )
}

function UnconfiguredButton({ className = '', compact = false }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!wrap.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Connect wallet"
        className={compact ? `grid h-10 w-full place-items-center rounded-xl bg-signal text-ink ${className}` : 'btn btn-signal'}
      >
        {compact ? <WalletGlyph /> : 'Connect wallet'}
      </button>
      {open && (
        <div className="pop-in absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-xl border border-cream/10 bg-ink-2 p-4 shadow-xl">
          <p className="text-sm font-semibold">Privy App ID needed</p>
          <p className="mt-2 text-sm leading-6 text-mute">
            Create an app at dashboard.privy.io, then add this to{' '}
            <code className="text-cream">.env.local</code> and restart Vite:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-[11px] text-gold">
            VITE_PRIVY_APP_ID=your_app_id
          </pre>
          <p className="mt-2 text-xs leading-5 text-mute">
            Enable Solana wallets + Twitter login, and allow localhost.
          </p>
          <a
            href="https://dashboard.privy.io"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-signal hover:underline"
          >
            Open Privy dashboard →
          </a>
        </div>
      )}
    </div>
  )
}
