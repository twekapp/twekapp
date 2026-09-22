import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { SocialX } from './SocialX'

export function Footer() {
  return (
    <footer className="footer-in border-t border-cream/10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-cream">
            <Logo className="h-6 w-6" />
            <span className="display text-sm font-extrabold">RYIOT</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-mute">
            A public bounty on a cashtag. Tweet $RYIOT, get scored, get paid.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mute">
          <Link to="/explore" className="hover:text-cream">
            Board
          </Link>
          <Link to="/earn" className="hover:text-cream">
            Earn
          </Link>
          <Link to="/payouts" className="hover:text-cream">
            Payment
          </Link>
          <Link to="/flow" className="hover:text-cream">
            Flow
          </Link>
          <Link to="/docs" className="hover:text-cream">
            Docs
          </Link>
          <Link to="/docs#legal" className="hover:text-cream">
            Legal
          </Link>
          <SocialX />
        </div>
      </div>
      <div className="border-t border-cream/8">
        <p className="mx-auto max-w-[1200px] px-4 py-4 text-xs text-mute/70 sm:px-6">
          RYIOT © 2026 · Not affiliated with X Corp.
        </p>
      </div>
    </footer>
  )
}
