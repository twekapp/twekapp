export const CONFIG = {
  name: 'TWEK',
  ticker: '$TWEK',
  handle: 'Twek_App',
  xUrl: 'https://x.com/Twek_App',
  ca: 'Eda7DAHso12o3KMoUPbQuW4EM6xnWqatxvbX18zNpump',
  tweetTemplate:
    'Just tweeted $TWEK and they pay you for it. Tweet the ticker, get paid.',
}

export const tweetIntentUrl = (text = CONFIG.tweetTemplate) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`

export const avatarUrl = (seed) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ff5a1f,f5c84c,25202d,ff8a5b`
