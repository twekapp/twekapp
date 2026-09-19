import { CONFIG } from '../config'
import { XMark } from './Logo'

export function SocialX({ className = '', compact = false }) {
  return (
    <a
      href={CONFIG.xUrl}
      target="_blank"
      rel="noreferrer"
      title={`@${CONFIG.handle} on X`}
      className={
        compact
          ? `grid h-10 w-full place-items-center rounded-xl border border-cream/12 text-mute hover:text-cream ${className}`
          : `inline-flex items-center gap-2 text-mute hover:text-cream ${className}`
      }
    >
      <XMark />
      {!compact && <span>@{CONFIG.handle}</span>}
    </a>
  )
}
