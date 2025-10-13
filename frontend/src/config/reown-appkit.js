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
    // Track if we've already handled a mobile return (prevents multiple fires)
    let mobileReturnHandled = false;
    let visibilityCheckTimer = null;
    
    // Handle page visibility changes (when user returns from wallet app)
    const handleVisibilityChange = () => {
      // Only proceed if:
      // 1. Page is now visible (not hidden)
      // 2. We haven't already handled this return
      // 3. User is on login page
      if (
        !document.hidden && 
        !mobileReturnHandled &&
        (window.location.pathname === '/login' || window.location.pathname === '/')
      ) {
        console.log('📱 Mobile: User returned from wallet app');
        
        // Clear any existing timer
        if (visibilityCheckTimer) {
          clearTimeout(visibilityCheckTimer);
        }
        
        // Wait for wallet connection to stabilize
        visibilityCheckTimer = setTimeout(() => {
          // Re-check visibility (user might have left again)
          if (document.hidden) {
            console.log('📱 Mobile: User left again, aborting');
            return;
          }
          
          // Check connection status
          if (window.appKitModal && window.appKitModal.getIsConnected) {
            window.appKitModal.getIsConnected()
              .then(isConnected => {
                console.log('📱 Mobile: Connection status:', isConnected);
                
                if (isConnected) {
                  // Mark as handled (prevents duplicate runs)
                  mobileReturnHandled = true;
                  
                  // Close modal if open
                  if (window.appKitModal.getIsOpen && window.appKitModal.getIsOpen()) {
                    window.appKitModal.close();
                    console.log('📱 Mobile: Modal closed');
                  }
                  
                  // Dispatch custom event for Login.jsx to handle
                  // (This lets React handle navigation, cleaner than direct window.location)
                  window.dispatchEvent(new CustomEvent('wallet-mobile-return', {
                    detail: { isConnected: true, timestamp: Date.now() }
                  }));
                  
                  console.log('📱 Mobile: Dispatched wallet-mobile-return event');
                }
              })
              .catch(err => {
                console.error('📱 Mobile: Connection check failed:', err);
              });
          }
        }, 1500); // Wait 1.5s for wallet to fully connect
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Reset handler when user navigates away from login
    const resetMobileHandler = () => {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        mobileReturnHandled = false;
        console.log('📱 Mobile: Reset handler (left login page)');
      }
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', resetMobileHandler);
    
    // Also reset on focus (in case navigation detection misses)
    window.addEventListener('focus', () => {
      setTimeout(resetMobileHandler, 100);
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
