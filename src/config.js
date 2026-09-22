export const CONFIG = {
  name: 'RYIOT',
  ticker: '$RYIOT',
  handle: 'RYIOT_App',
  xUrl: 'https://x.com/RYIOT_App',
  ca: 'Eda7DAHso12o3KMoUPbQuW4EM6xnWqatxvbX18zNpump',
  tweetTemplate:
    'Just tweeted $RYIOT and they pay you for it. Tweet the ticker, get paid.',
}

export const tweetIntentUrl = (text = CONFIG.tweetTemplate) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`

export const avatarUrl = (seed) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=78a9bf,f5c84c,25202d,ff8a5b`
