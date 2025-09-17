import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { arbitrum, mainnet, polygon, base, optimism } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://dashboard.reown.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a59546cb3a623a69279bc81df81919ec'

// 2. Create a metadata object
const metadata = {
  name: 'Olivia AI',
  description: 'AI-Powered Web3 Assistant Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://oliviaaiweb3-1.onrender.com',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Set the networks
const networks = [mainnet, arbitrum, polygon, base, optimism]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})

// 5. Create AppKit instance
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook'],
    emailShowWallets: true,
    swaps: true,
    onramp: true
  },
  themeMode: 'dark',
  themeVariables: {
    // Background colors
    '--w3m-color-bg-1': '#000000',
    '--w3m-color-bg-2': '#0a0a0a',
    '--w3m-color-bg-3': '#111111',
    
    // Accent colors - black/gray theme
    '--w3m-color-mix': '#333333',
    '--w3m-color-mix-strength': 10,
    '--w3m-accent': '#333333',
    
    // Text colors
    '--w3m-color-fg-1': '#ffffff',
    '--w3m-color-fg-2': '#cccccc',
    '--w3m-color-fg-3': '#999999',
    
    // Modal styling
    '--w3m-background-color': '#000000',
    '--w3m-background-border-radius': '16px',
    '--w3m-container-border-radius': '16px',
    '--w3m-wallet-icon-border-radius': '12px',
    '--w3m-input-border-radius': '8px',
    '--w3m-button-border-radius': '8px',
    '--w3m-border-radius-master': '12px',
    
    // Typography
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-font-size-master': '14px',
    
    // Z-index for modal overlay
    '--w3m-z-index': 9999,
    
    // Overlay background
    '--w3m-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
    '--w3m-overlay-backdrop-filter': 'blur(5px)'
  }
})

// Make modal accessible globally for custom buttons
if (typeof window !== 'undefined') {
  window.appKitModal = modal;
}

export { wagmiAdapter, queryClient, modal }
