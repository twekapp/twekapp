import { useEffect, useState } from 'react'

export function RollingNumber({ value, prefix = '$' }) {
  const target = Number(value) || 0
  const [n, setN] = useState(target)

  useEffect(() => {
    const from = n
    const to = target
    const delta = to - from
    if (Math.abs(delta) < 0.5) {
      setN(to)
      return
    }
    const started = performance.now()
    const duration = 420
    let frame = 0
    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration)
      setN(from + delta * t)
      if (t < 1) frame = requestAnimationFrame(tick)
      else setN(to)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  const formatted = Math.floor(n).toLocaleString('en-US')

  return (
    <span className="inline-flex items-center font-semibold tracking-tight tabular-nums leading-none">
      {prefix && <span className="leading-none">{prefix}</span>}
      {formatted.split('').map((ch, i) =>
        ch === ',' ? (
          <span key={`c-${i}`} className="px-[1px] leading-none text-mute">
            ,
          </span>
        ) : (
          <Digit key={`d-${i}-${formatted.length}`} d={Number(ch)} />
        ),
      )}
    </span>
  )
}

function Digit({ d }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
      <span
        className="absolute inset-x-0 top-0 leading-none transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${d}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="block h-[1em] overflow-hidden leading-none">
            {i}
          </span>
        ))}
      </span>
    </span>
  )
}
