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
  // Mobile-specific configurations
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
  mobileWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: 'metamask://',
        universal: 'https://metamask.app.link'
      }
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      links: {
        native: 'trust://',
        universal: 'https://link.trustwallet.com'
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      links: {
        native: 'cbwallet://',
        universal: 'https://go.cb-w.com'
      }
    }
  ],
  // Desktop wallet configurations
  desktopWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: 'metamask://',
        universal: 'https://metamask.io'
      }
    }
  ],
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
    
    // Mobile-responsive sizing
    '--w3m-modal-width': 'min(90vw, 400px)',
    '--w3m-modal-height': 'auto',
    '--w3m-modal-max-height': '90vh',
    
    // Button sizing for mobile
    '--w3m-button-size': '56px',
    '--w3m-button-icon-size': '24px',
    
    // Wallet item sizing
    '--w3m-wallet-item-height': '64px',
    '--w3m-wallet-icon-size': '40px',
    
    // Z-index for modal overlay
    '--w3m-z-index': 9999,
    
    // Overlay background
    '--w3m-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
    '--w3m-overlay-backdrop-filter': 'blur(5px)',
    
    // Mobile viewport fixes
    '--w3m-mobile-breakpoint': '768px'
  }
})

// Make modal accessible globally for custom buttons
if (typeof window !== 'undefined') {
  window.appKitModal = modal;
  
  // Mobile wallet return flow fixes
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Handle page visibility changes (when user returns from wallet app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // User returned to the page - check connection status
        setTimeout(() => {
          // Force a connection check
          if (window.appKitModal && window.appKitModal.getIsConnected) {
            window.appKitModal.getIsConnected().then(isConnected => {
              if (isConnected) {
                // Successfully connected - close modal if open
                if (window.appKitModal.getIsOpen && window.appKitModal.getIsOpen()) {
                  window.appKitModal.close();
                }
              }
            }).catch(console.error);
          }
        }, 1000); // Give wallet time to update connection status
      }
    });
    
    // Handle focus events (alternative to visibility change)
    window.addEventListener('focus', () => {
      setTimeout(() => {
        // Check if we should refresh connection status
        if (window.appKitModal) {
          // Trigger a refresh of the modal state
          try {
            window.appKitModal.subscribeState(() => {
              // State change handler - will update UI automatically
            });
          } catch (error) {
            console.log('Modal state subscription not available');
          }
        }
      }, 500);
    });
    
    // Prevent zoom on modal open
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
  }
}

export { wagmiAdapter, queryClient, modal }
