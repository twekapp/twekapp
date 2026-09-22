const edges = [
  { id: 'e1', d: 'M 106 72 H 330 A 40 40 0 0 1 370 112 A 40 40 0 0 0 410 150 H 444', delay: 0, dur: 2.8 },
  { id: 'e2', d: 'M 106 228 H 244', delay: 0.35, dur: 2.2 },
  { id: 'e3', d: 'M 296 228 H 330 A 40 40 0 0 0 370 188 A 40 40 0 0 1 410 150 H 444', delay: 0.8, dur: 2.6 },
  { id: 'e4', d: 'M 496 150 H 634', delay: 1.4, dur: 2 },
  { id: 'e5', d: 'M 686 150 H 824', delay: 1.8, dur: 2 },
]

const nodes = [
  { x: 80, y: 72, label: 'Dev wallet', icon: IconVault },
  { x: 80, y: 228, label: 'Tweet $RYIOT', icon: IconTweet },
  { x: 270, y: 228, label: 'Scored', icon: IconScore },
  { x: 470, y: 150, label: 'Reward pool', icon: IconPool },
  { x: 660, y: 150, label: 'Swap to USD', icon: IconUsd },
  { x: 850, y: 150, label: 'Paid to your Wallet', icon: IconPay },
]

function reduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function FlowDiagram() {
  const quiet = reduceMotion()

  return (
    <div className="flow-diagram-scroll overflow-x-auto">
      <svg
        viewBox="0 24 930 274"
        className="flow-diagram mx-auto block h-auto w-full min-w-[860px] text-cream"
        role="img"
        aria-label="Money flow from the Dev wallet and scored $RYIOT tweets to a payout in your wallet"
      >
        {edges.map((edge) => (
          <path key={`${edge.id}-rail`} d={edge.d} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
        ))}

        {edges.map((edge) => (
          <path
            key={`${edge.id}-pulse`}
            d={edge.d}
            fill="none"
            stroke="#ff5a1f"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="flow-pulse"
            style={{ animationDelay: `${edge.delay}s`, animationDuration: `${edge.dur}s` }}
          />
        ))}

        {edges.map((edge) => (
          <path key={edge.id} id={edge.id} d={edge.d} fill="none" />
        ))}

        {!quiet &&
          edges.flatMap((edge) => [
            <circle key={`${edge.id}-a`} r="3.4" fill="#f5c84c" className="flow-dot">
              <animateMotion dur={`${edge.dur}s`} begin={`${edge.delay}s`} repeatCount="indefinite">
                <mpath href={`#${edge.id}`} />
              </animateMotion>
            </circle>,
            <circle key={`${edge.id}-b`} r="2.2" fill="#ff5a1f" opacity="0.85" className="flow-dot">
              <animateMotion dur={`${edge.dur}s`} begin={`${edge.delay + 0.9}s`} repeatCount="indefinite">
                <mpath href={`#${edge.id}`} />
              </animateMotion>
            </circle>,
          ])}

        {nodes.map((node) => {
          const Icon = node.icon
          return (
            <g key={node.label} transform={`translate(${node.x} ${node.y})`}>
              <circle r="27" fill="none" stroke="currentColor" strokeOpacity="0.22" />
              <circle r="26" fill="#1c1824" />
              <g transform="translate(-9 -9)" className="text-signal">
                <Icon />
              </g>
              <text y="50" textAnchor="middle" className="fill-cream text-[11px] font-semibold">
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function IconTweet() {
  return (
    <path
      d="M14.5 2.2h2.4L12 8.1 18 16h-2.4L11.2 10.6 6.6 16H4.2l5.2-6.3L3.8 2.2h2.5l3.3 4.5z"
      fill="currentColor"
    />
  )
}

function IconVault() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="4" width="14" height="11" rx="2" />
      <path d="M2 7.5h14M11.5 11h2" />
    </g>
  )
}

function IconScore() {
  return (
    <path
      d="m9 1.6 2 5.2 5.6.3-4.4 3.4 1.6 5.3L9 12.8 4.2 15.8l1.6-5.3L1.4 7.1l5.6-.3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  )
}

function IconPool() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="9" r="6.5" />
      <path d="M9 5.2v7.6M6.4 7.4c.6-.9 1.5-1.3 2.6-1.3 1.5 0 2.6.8 2.6 2s-1.1 1.8-2.7 2.1c-1.6.3-2.6.8-2.6 2s1.2 1.9 2.7 1.9c1.1 0 2-.4 2.5-1.2" />
    </g>
  )
}

function IconUsd() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 4.8v8.4M6.6 7.2c.5-.9 1.4-1.3 2.4-1.3 1.4 0 2.5.7 2.5 1.9s-1.1 1.8-2.6 2.1c-1.6.3-2.6.9-2.6 2.1s1.2 2 2.7 2c1.1 0 2-.5 2.5-1.3" />
    </g>
  )
}

function IconPay() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1.5" y="4.2" width="15" height="10.5" rx="2" />
      <path d="M1.5 8.2h15" />
      <path d="M12.2 11.4h2.2" />
    </g>
  )
}
