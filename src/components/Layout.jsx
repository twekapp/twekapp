import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { Footer } from './Footer'
import { WalletButton } from './WalletButton'
import { CopyCa } from './CopyCa'
import { SocialX } from './SocialX'
import { PageEnter } from './PageEnter'

const SIDEBAR_KEY = 'ryiot-sidebar-open'

const links = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/explore', label: 'Board', icon: IconBoard },
  { to: '/earn', label: 'Earn', icon: IconEarn },
  { to: '/payouts', label: 'Payment', icon: IconPayouts },
  { to: '/flow', label: 'Flow', icon: IconFlow },
  { to: '/analytics', label: 'Stats', icon: IconStats },
  { to: '/docs', label: 'Docs', icon: IconDocs },
]

function readOpen() {
  if (typeof window === 'undefined') return true
  const saved = window.localStorage.getItem(SIDEBAR_KEY)
  if (saved === '0') return false
  return true
}

export function Layout() {
  const location = useLocation()
  const [open, setOpen] = useState(readOpen)

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  function toggle() {
    setOpen((prev) => {
      const next = !prev
      window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="flex min-h-svh text-cream">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/50 md:hidden"
          aria-label="Close sidebar"
          onClick={toggle}
        />
      )}

      <aside
        className={`side-in fixed inset-y-0 left-0 z-40 flex flex-col border-r border-cream/10 bg-ink/92 backdrop-blur-md transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:sticky md:top-0 md:h-svh md:shrink-0 ${
          open ? 'w-56' : 'w-16'
        }`}
      >
        <div className={`flex h-14 items-center ${open ? 'px-4' : 'justify-center px-2'}`}>
          <Link to="/" className="flex items-center gap-2.5 text-cream" aria-label="RYIOT home">
            <Logo className="h-7 w-7 shrink-0" />
            {open && <span className="display text-base font-extrabold tracking-tight">RYIOT</span>}
          </Link>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 ${open ? 'px-3' : 'px-2'}`}>
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                title={link.label}
                aria-label={link.label}
                className={({ isActive }) =>
                  `nav-link flex items-center rounded-xl text-sm transition-colors ${
                    open ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5'
                  } ${isActive ? 'bg-cream/8 text-cream' : 'text-mute hover:bg-cream/5 hover:text-cream'}`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {open && <span>{link.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className={`mt-auto border-t border-cream/8 py-3 ${open ? 'px-3' : 'px-2'}`}>
          <SocialX
            compact={!open}
            className={`mb-2 w-full ${open ? 'rounded-lg border border-cream/12 px-3 py-1.5 text-xs' : ''}`}
          />
          <CopyCa compact={!open} className="mb-2 w-full" />
          <WalletButton compact={!open} menuSide="right" className="w-full whitespace-nowrap" />
          <button
            type="button"
            onClick={toggle}
            className={`mt-2 flex w-full items-center rounded-xl py-2.5 text-sm text-mute hover:bg-cream/5 hover:text-cream ${
              open ? 'gap-3 px-3' : 'justify-center'
            }`}
            aria-expanded={open}
            aria-label={open ? 'Minimize sidebar' : 'Maximize sidebar'}
            title={open ? 'Minimize' : 'Maximize'}
          >
            <IconCollapse className={`h-[18px] w-[18px] ${open ? '' : 'rotate-180'}`} />
            {open && <span>Minimize</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col max-md:pl-16">
        <PageEnter>
          <Outlet />
        </PageEnter>
        <Footer />
      </div>
    </div>
  )
}

function IconHome({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function IconBoard({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconEarn({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 15.5 9 8l3.5 5 2.5-3.5L20 16" />
      <path d="M15 7h5v5" />
    </svg>
  )
}

function IconPayouts({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.8 10.2c.5-.8 1.3-1.2 2.2-1.2 1.3 0 2.3.7 2.3 1.8s-1 1.7-2.4 2c-1.5.3-2.4.8-2.4 2s1.1 1.8 2.5 1.8c1 0 1.8-.4 2.3-1.2" />
    </svg>
  )
}

function IconFlow({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h10M4 12h16M4 17h7" />
      <path d="m12 5 4 2-4 2M18 10l3 2-3 2M9 15l3 2-3 2" />
    </svg>
  )
}

function IconStats({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19V10M10 19V5M15 19v-7M20 19V8" />
    </svg>
  )
}

function IconDocs({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4M9 12h6M9 16h4" />
    </svg>
  )
}

function IconCollapse({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 6 9 12l6 6" />
    </svg>
  )
}
