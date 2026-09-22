export function Logo({ className = 'h-7 w-7' }) {
  return (
    <img
      src="/TWEKPFP.jpg"
      alt="RYIOT"
      className={`block rounded-[22%] object-cover ${className}`}
    />
  )
}

export function XMark({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
