import { Link } from 'react-router-dom'
import { CONFIG } from '../config'
import { FlowDiagram } from '../components/FlowDiagram'

const path = [
  {
    n: '01',
    title: 'You tweet $TWEK',
    body: 'Public post, your words, cashtag in the body. That tweet is the claim ticket. No form.',
  },
  {
    n: '02',
    title: 'We catch it and score it',
    body: 'The stream hashes the tweet id once. Impressions, originality, and recency decide your slice.',
  },
  {
    n: '03',
    title: 'The Dev wallet funds the pool',
    body: 'Payouts leave the TWEK Dev wallet. No treasury hop. That wallet is the budget for scored tweets.',
  },
  {
    n: '04',
    title: 'Dev wallet turns it into dollars',
    body: 'Funds sit as SOL or $TWEK first. We swap to USD so you get cash, not a bag you still have to sell.',
  },
  {
    n: '05',
    title: 'Hourly batch pays your wallet',
    body: 'If your share is at least $0.50, it goes to the connected wallet. X is how we match the tweet. The wallet gets the money.',
  },
]

export function Flow() {
  return (
    <main className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Capital flow</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
        How a tweet turns into cash
      </h1>
      <p className="mt-4 max-w-[62ch] text-[16px] leading-7 text-mute">
        Nobody wires you a personal check. The Dev wallet funds the pool, we convert that pile to
        dollars, and scored tweets take a share. This is the path from a cashtag to money in your
        wallet.
      </p>

      <div className="panel mt-8 px-3 py-6 sm:px-5">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
          Tweet fee flow
        </p>
        <p className="mt-2 px-2 text-sm leading-6 text-mute">
          The Dev wallet funds the pool. Tweets get scored. Those two streams meet, swap to
          dollars, then land in the connected wallet.
        </p>
        <div className="relative mt-4">
          <FlowDiagram />
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">The loop, in order</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          Skip a step and we cannot pay you. Connect a wallet and link X before you post, or the
          tweet has nowhere to land.
        </p>
        <ol className="stagger mt-6 grid gap-3">
          {path.map((step) => (
            <li key={step.n} className="panel flex gap-4 p-4 sm:p-5">
              <span className="display w-10 shrink-0 text-2xl font-extrabold text-signal">{step.n}</span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="mt-1.5 text-sm leading-7 text-mute">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 grid gap-3 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">You get paid if</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-cream/75">
            <li>The tweet is public and includes {CONFIG.ticker}</li>
            <li>It came from the X account you linked</li>
            <li>Your scored share is at least $0.50</li>
            <li>The pool had dollars that hour</li>
          </ul>
        </div>
        <div className="panel p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-signal">You do not get paid if</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-cream/75">
            <li>No cashtag, or a private / deleted tweet</li>
            <li>Wallet in, but X never linked</li>
            <li>Copy-paste raids and empty “gm $TWEK”</li>
            <li>The slice is dust under fifty cents</li>
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">On-chain rail</h2>
        <p className="mt-2 text-sm text-mute">
          Sends are still manual. After the Dev wallet pays, mark the row on Payment. No fake
          ACH / X Money feed.
        </p>
        <div className="panel mt-6 p-5 text-sm leading-6 text-mute">
          No on-chain rail yet. When a payout is marked sent, it shows on Payment with the tx you
          pasted.
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/earn" className="btn btn-signal px-5 py-2.5">
          Tweet to earn
        </Link>
        <Link to="/docs#flow" className="btn btn-ghost px-5 py-2.5">
          Read the docs
        </Link>
      </div>
    </main>
  )
}
