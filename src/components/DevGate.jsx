import { useState } from 'react'

export function DevGate({ admin, onUnlock, onLock }) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (!key.trim()) return
    setBusy(true)
    setNote('')
    try {
      await onUnlock(key.trim())
      setKey('')
      setOpen(false)
    } catch (err) {
      setNote(err.message || 'Wrong key.')
    } finally {
      setBusy(false)
    }
  }

  if (admin) {
    return (
      <button type="button" onClick={onLock} className="text-[11px] font-semibold text-gold">
        Dev tools on
      </button>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-semibold text-mute/40 hover:text-mute"
      >
        Dev
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Dev key"
        autoFocus
        className="w-40 rounded-lg border border-cream/12 bg-transparent px-3 py-1.5 text-xs outline-none"
      />
      <button type="submit" disabled={busy} className="text-[11px] font-semibold text-signal">
        {busy ? '…' : 'Unlock'}
      </button>
      {note && <span className="text-[11px] text-signal">{note}</span>}
    </form>
  )
}
