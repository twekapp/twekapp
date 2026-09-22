import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PrivyProvider, useLinkAccount, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { linkUser } from '../lib/api'
import { toSolanaWalletConnectors, useWallets as useSolanaWallets } from '@privy-io/react-auth/solana'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

const APP_ID = import.meta.env.VITE_PRIVY_APP_ID
const CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID

const SOLANA_WALLET_LIST = [
  'phantom',
  'solflare',
  'backpack',
  'jupiter',
  'detected_solana_wallets',
  'wallet_connect_qr_solana',
]

export const privyConfigured = Boolean(APP_ID)

const AuthContext = createContext(null)

const emptyAuth = {
  configured: false,
  ready: true,
  authenticated: false,
  address: null,
  shortAddress: null,
  xHandle: null,
  xName: null,
  xAvatar: null,
  usingEmbedded: false,
  privyAuthenticated: false,
  authNote: '',
  login: () => {},
  logout: () => {},
  linkX: () => {},
}

function shortAddr(address) {
  if (!address) return null
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

function twitterAvatar(account) {
  const raw = account?.profilePictureUrl || account?.profile_picture_url || null
  if (!raw) return null
  return String(raw).replace(/_normal(\.[a-zA-Z0-9]+)$/i, '_x96$1')
}

function twitterFromUser(user) {
  if (!user) return { handle: null, name: null, avatar: null }
  const named = user.twitter
  if (named?.username) {
    return {
      handle: named.username,
      name: named.name || named.username,
      avatar: twitterAvatar(named),
    }
  }
  const linked = user.linkedAccounts?.find(
    (a) => a.type === 'twitter_oauth' || a.type === 'twitter',
  )
  if (linked?.username) {
    return {
      handle: linked.username,
      name: linked.name || linked.username,
      avatar: twitterAvatar(linked),
    }
  }
  return { handle: null, name: null, avatar: null }
}

function getInjectedSolana() {
  if (typeof window === 'undefined') return null
  return window.phantom?.solana || window.solflare || window.solana || null
}

function publicKeyOf(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toBase58?.() || value.toString?.() || null
}

function isEmbeddedWallet(wallet) {
  const client = String(wallet?.walletClientType || '')
  const connector = String(wallet?.connectorType || '')
  return client === 'privy' || client === 'privy-v2' || connector === 'embedded'
}

function pickPayAddress(wallets, injected, user) {
  const list = Array.isArray(wallets) ? wallets : []
  const external = list.find((wallet) => wallet.address && !isEmbeddedWallet(wallet))
  if (external?.address) return { address: external.address, embedded: false }
  if (injected?.address) return { address: injected.address, embedded: false }
  const embedded = list.find((wallet) => wallet.address)
  if (embedded?.address) return { address: embedded.address, embedded: true }
  if (user?.wallet?.address) {
    return { address: user.wallet.address, embedded: isEmbeddedWallet(user.wallet) }
  }
  return { address: null, embedded: false }
}

function explainAuthError(err) {
  const msg = String(err?.message || err || '')
  if (/already|linked|exists|taken|associated/i.test(msg)) {
    return 'This X is already tied to another login. Disconnect, sign in with X, then Use your main wallet.'
  }
  return msg || 'Could not link X. Try again.'
}

function PrivyBridge({ children }) {
  const { ready, authenticated, user, logout, connectWallet, linkWallet } = usePrivy()
  const [authNote, setAuthNote] = useState('')
  const { linkTwitter } = useLinkAccount({
    onError: (err) => setAuthNote(explainAuthError(err)),
    onSuccess: () => setAuthNote(''),
  })
  const { initOAuth } = useLoginWithOAuth({
    onError: (err) => setAuthNote(explainAuthError(err)),
  })
  const solana = useSolanaWallets()
  const wallets = Array.isArray(solana.wallets) ? solana.wallets : []
  const [injected, setInjected] = useState(null)
  const picked = pickPayAddress(wallets, injected, user)
  const address = picked.address
  const x = twitterFromUser(user)

  useEffect(() => {
    if (!address || !x.handle) return
    linkUser({ handle: x.handle, wallet: address, avatar: x.avatar }).catch(() => {})
  }, [address, x.handle, x.avatar])

  const value = useMemo(() => {

    async function tryInjected() {
      const provider = getInjectedSolana()
      if (!provider?.connect) return null
      try {
        const res = await provider.connect()
        const next = publicKeyOf(res?.publicKey) || publicKeyOf(provider.publicKey)
        if (next) {
          setInjected({ address: next, provider })
          return next
        }
      } catch (err) {
        if (err?.code === 4001 || err?.message?.includes('User rejected')) return null
      }
      return null
    }

    async function connect() {
      const walletModal = {
        walletChainType: 'solana-only',
        walletList: SOLANA_WALLET_LIST,
        description: 'Connect your main Solana wallet',
      }
      try {
        if (authenticated) {
          await linkWallet(walletModal)
          return
        }
        await tryInjected()
        await connectWallet(walletModal)
      } catch (err) {
        if (err?.code === 4001 || err?.message?.includes('User rejected')) return
        await tryInjected()
      }
    }

    async function disconnect() {
      try {
        await injected?.provider?.disconnect?.()
      } catch {
        // already disconnected
      }
      setInjected(null)
      await Promise.all(
        wallets.map(async (wallet) => {
          try {
            await wallet.disconnect?.()
          } catch {
            // already disconnected
          }
        }),
      )
      if (authenticated) await logout()
    }

    return {
      configured: true,
      ready,
      authenticated: authenticated || Boolean(address),
      address,
      shortAddress: shortAddr(address),
      xHandle: x.handle,
      xName: x.name,
      xAvatar: x.avatar,
      usingEmbedded: picked.embedded,
      privyAuthenticated: authenticated,
      authNote,
      login: () => connect(),
      logout: () => disconnect(),
      linkX: () => {
        setAuthNote('')
        try {
          if (authenticated) {
            linkTwitter()
            return
          }
          initOAuth({ provider: 'twitter' })
        } catch (err) {
          setAuthNote(explainAuthError(err))
        }
      },
    }
  }, [ready, authenticated, address, picked.embedded, x, wallets, injected, connectWallet, linkWallet, logout, linkTwitter, initOAuth, authNote])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }) {
  if (!APP_ID) {
    return <AuthContext.Provider value={emptyAuth}>{children}</AuthContext.Provider>
  }

  return (
    <PrivyProvider
      appId={APP_ID}
      {...(CLIENT_ID ? { clientId: CLIENT_ID } : {})}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#78a9bf',
          logo: '/RYIOTPFP.png',
          landingHeader: 'Connect to RYIOT',
          walletChainType: 'solana-only',
          showWalletLoginFirst: true,
          walletList: SOLANA_WALLET_LIST,
        },
        loginMethods: ['wallet', 'twitter'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'off',
          },
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
          },
        },
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'),
              rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com'),
            },
          },
        },
      }}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
