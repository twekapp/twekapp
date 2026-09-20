import { Link } from 'react-router-dom'
import { CONFIG } from '../config'

const toc = [
  { href: '#how', label: 'How you get paid' },
  { href: '#qualify', label: 'What to tweet' },
  { href: '#score', label: 'How much you get' },
  { href: '#claim', label: 'When money arrives' },
  { href: '#flow', label: 'Where the money comes from' },
  { href: '#detect', label: 'How we find tweets' },
  { href: '#token', label: '$TWEK' },
  { href: '#legal', label: 'Legal' },
]

export function Docs() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Docs</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
        How tweeting $TWEK pays you
      </h1>
      <p className="mt-4 text-[16px] leading-7 text-mute">
        TWEK is a public bounty. People trade the token, fees go into a reward pool, and anyone who
        posts <span className="text-cream">{CONFIG.ticker}</span> on X can take a share of that pool
        in dollars. You do not need a campaign manager, a form, or a referral code. The tweet is the
        claim.
      </p>

      <nav className="stagger mt-8 grid gap-2 sm:grid-cols-2">
        {toc.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="panel lift px-4 py-3 text-sm text-cream/80 hover:text-cream"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section id="how" className="scroll-mt-24">
        <h2 className="mt-14 text-2xl font-extrabold tracking-tight">The loop, in order</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          This is the real path from a tweet to cash. Skip a step and we cannot pay you.
        </p>
        <ol className="stagger mt-6 grid gap-3">
          <Step n="1" title="Connect a wallet">
            Open TWEK and hit <span className="text-cream">Connect wallet</span>. Use Phantom or
            Solflare — your main Solana wallet. That address is where dollars land.
          </Step>
          <Step n="2" title="Link the X account you will tweet from">
            After the wallet is in, link X. We pay the handle that wrote the tweet, not a wallet
            someone pastes later. If you tweet from @you, @you is who gets paid.
          </Step>
          <Step n="3" title="Post a real tweet that includes $TWEK">
            Write something original about the project and put{' '}
            <span className="text-cream">{CONFIG.ticker}</span> in the text. That cashtag is the
            ticket. No cashtag, no score. You can compose it on the{' '}
            <Link to="/earn" className="text-signal hover:underline">
              Earn
            </Link>{' '}
            page, or post on X first and paste the URL.
          </Step>
          <Step n="4" title="We detect it, then score it">
            After launch, a filtered X search watches for {CONFIG.ticker}. Each tweet id is stored
            once. We then score it: impressions, whether the post is original, how the account
            looks, and how fresh it is. Copy-paste raids and reply-spam get downranked. Search is
            off until go-live so credits stay put.
          </Step>
          <Step n="5" title="If the share is at least $0.50, you get paid">
            Your score is a slice of the live pool. Settlement runs about once an hour. Amounts
            under $0.50 are skipped so the payout is never smaller than the cost of sending it.
            Dollars go to the connected wallet.
          </Step>
        </ol>
      </section>

      <section id="qualify" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight">What a paid tweet looks like</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          The rule is simple: it has to be a public post on X, it has to include the cashtag, and it
          has to look like a person saying something, not a raid bot.
        </p>
        <div className="stagger mt-6 grid gap-3 sm:grid-cols-2">
          <Callout title="Gets scored" tone="good">
            <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-cream/75">
              <li>A public tweet with {CONFIG.ticker} in the body</li>
              <li>Your own words, not a copied raid line</li>
              <li>Posted from the X account you linked</li>
              <li>Quotes and replies that add a real take (they rank lower than originals)</li>
            </ul>
          </Callout>
          <Callout title="Gets skipped or crushed" tone="bad">
            <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-cream/75">
              <li>No {CONFIG.ticker} in the tweet</li>
              <li>The same sentence posted by twenty accounts</li>
              <li>Reply-spam, quote-spam, or empty “gm $TWEK”</li>
              <li>Private accounts, deleted tweets, or a handle we did not link</li>
            </ul>
          </Callout>
        </div>
        <div className="panel mt-3 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-signal">
            Example that qualifies
          </p>
          <p className="mt-3 text-[15px] leading-7 text-cream/90">
            “Just tweeted {CONFIG.ticker} and they pay you for it. Tweet the ticker, get paid.”
          </p>
          <p className="mt-3 text-sm leading-6 text-mute">
            That line has the cashtag, says what the project does, and is not a 50-account copy. It
            is enough. A longer original take with real impressions will score higher.
          </p>
        </div>
      </section>

      <section id="score" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight">How much you get</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          You are not paid a flat bounty. You are paid a share of the pool that was live when we
          scored the tweet. Bigger, cleaner attention takes a bigger slice.
        </p>
        <div className="stagger mt-6 grid gap-3 sm:grid-cols-2">
          <Fact label="Impressions" body="More eyes help, but not linearly. The first thousand views count more than the next ten thousand. We use impressions^0.6 so mega-accounts cannot vacuum the whole pool." />
          <Fact label="Quality" body="Original writing, real replies, and a normal account history beat a brand-new handle blasting the same line. Age and trust sit here." />
          <Fact label="Recency" body="A tweet scored now is worth more than one we find two days late. The pool is for attention that is happening." />
          <Fact label="One tweet, one payout" body="Each tweet id is paid once. You can post again. Farming the same screenshot or pasting the same URL does nothing." />
        </div>
        <div className="panel mt-3 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">The share</p>
          <p className="mt-3 font-mono text-[13px] leading-7 text-gold">
            payout = pool × impressions^0.6 × quality × recency
          </p>
          <p className="mt-3 text-sm leading-6 text-mute">
            Quality is a 0–1 blend of originality, engagement rate, and account trust. If ten people
            tweet in the same hour, they split whatever is in the pool by those weights. There is no
            hidden multiplier for friends of the team.
          </p>
        </div>
      </section>

      <section id="claim" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight">When the money arrives</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          You do not click a claim button for every tweet. After we score it, settlement runs on a
          timer.
        </p>
        <ul className="mt-6 grid gap-3 text-sm leading-7 text-cream/80">
          <li className="panel p-4">
            <span className="font-semibold text-cream">Hourly settlement.</span>{' '}
            <span className="text-mute">
              Scored tweets land in the next hourly batch. If you posted at 3:10, look for the 4:00
              run, not an instant push.
            </span>
          </li>
          <li className="panel p-4">
            <span className="font-semibold text-cream">Minimum $0.50.</span>{' '}
            <span className="text-mute">
              Dust under fifty cents is skipped. Sending it would cost more than the payout. Post
              something that can actually clear that line.
            </span>
          </li>
          <li className="panel p-4">
            <span className="font-semibold text-cream">Paid to the linked wallet.</span>{' '}
            <span className="text-mute">
              Dollars go to the Solana wallet you connected. X is how we match the tweet to you. A
              wallet in a bio does not count.
            </span>
          </li>
        </ul>
      </section>

      <section id="flow" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight">Where the money comes from</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          Nobody is wiring you a personal check. The token pays for its own attention.
        </p>
        <ol className="stagger mt-6 grid gap-3">
          <Step n="A" title="The Dev wallet holds the budget">
            Payouts leave the TWEK Dev wallet. No treasury hop. If that wallet is quiet, the pool
            is smaller. If it is funded, the bounty grows.
          </Step>
          <Step n="B" title="Dev wallet swaps to dollars">
            Funds sit as SOL or the token first. We convert them to dollars so a tweet pays in cash,
            not in a bag you still have to sell.
          </Step>
          <Step n="C" title="The pool is split across scored tweets">
            Each qualifying post takes a weighted share. Public payouts show who got what, so the
            board and the leaderboard stay honest.
          </Step>
        </ol>
        <p className="mt-4 text-sm leading-7 text-mute">
          The same path, drawn end to end, lives on the{' '}
          <Link to="/flow" className="text-signal hover:underline">
            Flow
          </Link>{' '}
          page — tweet, Dev wallet, swap, payout.
        </p>
      </section>

      <section id="detect" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight">How we find the tweet</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          We do not ask you to @ a bot or drop a screenshot in Discord. After launch, a filtered X
          search watches for {CONFIG.ticker}. When a matching tweet appears, we store the tweet id
          once, bind it to the handle&apos;s payout wallet, and queue it for scoring.
        </p>
        <p className="mt-3 text-sm leading-7 text-mute">
          If we miss it, paste the tweet URL on the Earn page after search is on. Same scorer. Same
          pool. Same $0.50 floor. Until then, X lookup is paused.
        </p>
      </section>

      <section id="token" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight">{CONFIG.ticker}</h2>
        <p className="mt-3 text-sm leading-7 text-mute">
          Ticker {CONFIG.ticker}. Contract{' '}
          <span className="break-all font-mono text-cream">{CONFIG.ca}</span>
          . Official X is{' '}
          <a
            href={CONFIG.xUrl}
            target="_blank"
            rel="noreferrer"
            className="text-cream hover:underline"
          >
            @{CONFIG.handle}
          </a>
          . The Dev wallet is the budget. The tweet is the claim ticket. Holding the token is not
          required to get paid, and holding it does not pay you by itself. Posting does.
        </p>
        <div className="panel mt-6 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
            Payout record
          </p>
          <p className="mt-3 text-sm leading-6 text-mute">
            Mark paid writes the row in Supabase (amount, wallet, time). On-chain send from the Dev
            wallet is still manual. There is no on-chain program yet.
          </p>
        </div>
      </section>

      <section id="legal" className="panel mt-14 scroll-mt-24 p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-signal">Legal</h2>
        <p className="mt-3 text-sm leading-7 text-cream/70">
          Not an offer of securities. Not affiliated with X Corp. Rewards are
          promotional and can change or stop. Do not farm with inauthentic engagement, bought
          impressions, or botnets. If a tweet is fake, it does not get paid.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/earn" className="btn btn-signal px-5 py-2.5">
          Tweet to earn
        </Link>
        <Link to="/explore" className="btn btn-ghost px-5 py-2.5">
          See paid tweets
        </Link>
      </div>
    </main>
  )
}

function Step({ n, title, children }) {
  return (
    <li className="panel flex gap-4 p-4 sm:p-5">
      <span className="display w-8 shrink-0 text-2xl font-extrabold text-signal">{n}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1.5 text-sm leading-7 text-mute">{children}</p>
      </div>
    </li>
  )
}

function Callout({ title, children, tone }) {
  return (
    <div className="panel p-5">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${tone === 'good' ? 'text-gold' : 'text-signal'}`}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Fact({ label, body }) {
  return (
    <div className="panel p-4">
      <p className="font-semibold">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-mute">{body}</p>
    </div>
  )
}
