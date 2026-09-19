import { useState } from 'react'
import { CONFIG } from '../config'
import { shortCa } from '../lib/format'

function CopyChip({ value, label, className = '', compact = false }) {
  const [ok, setOk] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setOk(true)
      setTimeout(() => setOk(false), 1400)
    } catch {
      setOk(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`${label} ${value}`}
      className={
        compact
          ? `grid h-10 w-full place-items-center rounded-xl border border-cream/12 font-mono text-[10px] text-mute hover:text-cream ${className}`
          : `rounded-lg border border-cream/12 px-3 py-1.5 font-mono text-xs text-mute hover:text-cream ${className}`
      }
    >
      {ok ? 'Copied' : compact ? label : `${label} ${shortCa(value)}`}
    </button>
  )
}

export function CopyCa({ className = '', compact = false }) {
  if (!CONFIG.ca) {
    return (
      <p
        title="Contract address coming soon"
        className={
          compact
            ? `grid h-10 w-full place-items-center rounded-xl border border-cream/12 font-mono text-[10px] text-mute ${className}`
            : `rounded-lg border border-cream/12 px-3 py-1.5 font-mono text-xs text-mute ${className}`
        }
      >
        {compact ? 'CA' : 'CA Coming soon'}
      </p>
    )
  }

  return <CopyChip value={CONFIG.ca} label="CA" className={className} compact={compact} />
}
