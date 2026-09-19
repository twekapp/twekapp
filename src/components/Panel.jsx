import { Link } from 'react-router-dom'

export function Panel({ title, to, children, className = '', action = 'Open →' }) {
  return (
    <section className={`panel relative flex min-h-[320px] flex-col overflow-hidden ${className}`}>
      <div className="min-h-0 flex-1 p-3 sm:p-4">{children}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black via-black/80 to-transparent px-5 pb-4 pt-16">
        <p className="text-sm text-white/70">{title}</p>
        {to && (
          <Link to={to} className="pointer-events-auto text-sm text-white/45 hover:text-white">
            {action}
          </Link>
        )}
      </div>
    </section>
  )
}
