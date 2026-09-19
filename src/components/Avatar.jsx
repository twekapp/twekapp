import { avatarUrl } from '../config'
import { safeAvatarUrl } from '../lib/safeUrl'

export function Avatar({ seed, src, className = 'h-8 w-8' }) {
  return (
    <img
      src={safeAvatarUrl(src) || avatarUrl(seed)}
      alt=""
      className={`${className} rounded-lg bg-cream/10 object-cover`}
    />
  )
}
