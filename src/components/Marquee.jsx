import { Children } from 'react'

export function MarqueeColumns({ childrenA, childrenB, className = '' }) {
  return (
    <div className={`marquee-mask grid h-full grid-cols-2 gap-3 overflow-hidden ${className}`}>
      <div className="overflow-hidden">
        <div className="marquee-y flex flex-col gap-3" style={{ '--marquee-duration': '44s' }}>
          <Loop>{childrenA}</Loop>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="marquee-y-rev flex flex-col gap-3" style={{ '--marquee-duration': '56s' }}>
          <Loop>{childrenB}</Loop>
        </div>
      </div>
    </div>
  )
}

export function MarqueeList({ children }) {
  return (
    <div className="marquee-mask h-full overflow-hidden">
      <div className="marquee-y flex flex-col gap-2.5" style={{ '--marquee-duration': '32s' }}>
        <Loop>{children}</Loop>
      </div>
    </div>
  )
}

function Loop({ children }) {
  const list = Children.toArray(children)
  return (
    <>
      {list.map((child, i) => (
        <div key={`a-${i}`}>{child}</div>
      ))}
      {list.map((child, i) => (
        <div key={`b-${i}`}>{child}</div>
      ))}
    </>
  )
}
