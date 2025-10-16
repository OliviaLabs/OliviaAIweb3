// src/pages/Login.jsx
import { useAuth } from '../contexts/AuthContext';
import { useInternetIdentity } from '../contexts/InternetIdentityContext';
import Button from '../components/ui/Button';
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, Shield, UserCheck, LogOut } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';

export default function Login() {
  // Authentication context
  const { setUserAuthenticated, setUserData, loginAsGuest, setIsGuestUser, userAuthenticated, logout } = useAuth();
  const { login: internetIdentityLogin, principal, isLoading: iiLoading, isAuthenticated } = useInternetIdentity();
  const { isConnected, address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const { open } = useAppKit();
  
  // Use ref to track if we've already initiated wallet login (prevents loops)
  const walletLoginAttemptedRef = useRef(false);
  const navigationTimerRef = useRef(null);


  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initData && tg.initDataUnsafe) {
      // Check if they're on Telegram WebApp
      // platform might be: 'android', 'ios', 'web', etc.
      if (tg.platform && tg.platform !== "web") {
        // => Official Telegram in‐app browser (mobile or desktop),
        //    not Telegram Web (browser).
        tg.expand();
        tg.disableVerticalSwipes();
        tg.onEvent("viewportChanged", () => {
          if (!tg.isExpanded) {
            tg.expand();
          }
        });
        return; // Keep normal flow
      }
    }
  }, []);

  // Handle guest login
  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/home');
  };

  // Handle Internet Identity login
  const handleInternetIdentityLogin = async () => {
    try {
      await internetIdentityLogin();
    } catch (error) {
      console.error('Internet Identity login failed:', error);
    }
  };

  // Watch for Internet Identity authentication success and navigate to app
  useEffect(() => {
    if (isAuthenticated && principal && !iiLoading) {
      setUserData({
        user_id: principal,
        first_name: 'User', 
        last_name: '',
        email: '',
        auth_method: 'internet_identity',
        is_guest: false
      });
      setIsGuestUser(false);
      setUserAuthenticated(true);
      navigate('/home');
    }
  }, [isAuthenticated, principal, iiLoading]);

  // ROBUST WALLET AUTO-LOGIN (Mobile-Safe)
  useEffect(() => {
    // Guard: Only proceed if wallet connected, has address, user NOT authenticated, and haven't tried yet
    if (!isConnected || !address || userAuthenticated || walletLoginAttemptedRef.current) {
      return;
    }

    console.log('📱 Wallet detected:', address.slice(0, 6) + '...' + address.slice(-4), 'connector:', connector?.name);
    
    // Mark that we're attempting login (prevents re-runs)
    walletLoginAttemptedRef.current = true;
    
    // Set user data
    const userData = {
      user_id: address,
      first_name: `${address.slice(0, 6)}...${address.slice(-4)}`,
      last_name: '',
      email: '',
      auth_method: 'web3',
      wallet_address: address,
      connector: connector?.name,
      is_guest: false
    };
    
    setUserData(userData);
    setIsGuestUser(false);
    setUserAuthenticated(true);
    
    console.log('✅ User authenticated with wallet');
    
    // Primary navigation (React Router)
    navigate('/home');
    
    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mobile-only fallback with proper checks
    if (isMobile) {
      console.log('📱 Mobile detected: Setting up fallback navigation');
      
      navigationTimerRef.current = setTimeout(() => {
        // Triple-check before fallback:
        // 1. Still on login page?
        // 2. Wallet still connected?
        // 3. Haven't navigated yet?
        if (
          (window.location.pathname === '/login' || window.location.pathname === '/') &&
          isConnected &&
          address
        ) {
          console.log('🔄 Mobile fallback: React Router didn\'t trigger, using direct navigation');
          window.location.href = '/home';
        } else {
          console.log('✅ Mobile fallback: Not needed, already navigated');
        }
      }, 1200);
    }
    
    // Cleanup function
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, [isConnected, address, connector, userAuthenticated]);
  
  // Reset walletLoginAttemptedRef when wallet disconnects
  useEffect(() => {
    if (!isConnected && !address) {
      walletLoginAttemptedRef.current = false;
      console.log('🔌 Wallet disconnected, reset login flag');
    }
  }, [isConnected, address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center px-8">
        {/* Premium Logo Section */}
        <div className="text-center mb-16 flex flex-col items-center justify-center">
          <img
            src="/thinking.gif"
            alt="Olivia AI"
            className="w-auto h-[160px] mb-6 drop-shadow-2xl mx-auto"
          />
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>



        {/* Sleek Login Options */}
        <div className="w-full space-y-3 max-w-sm mx-auto" style={{ position: 'relative', zIndex: 100 }}>
          {/* Connect Wallet Button - Top Priority */}
          <button
            onClick={() => {
              // Use the global appKitModal
              if (window.appKitModal && window.appKitModal.open) {
                window.appKitModal.open();
              } else {
                // Fallback to clicking the button
                const appkitButton = document.querySelector('appkit-button');
                if (appkitButton) {
                  appkitButton.click();
                }
              }
            }}
            className="group w-full bg-gray-900 hover:bg-gray-800 rounded-lg px-6 py-4 transition-all duration-200 border-2 border-white/30 hover:border-white/50"
            style={{ display: 'block', visibility: 'visible', opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-white" />
              <span className="text-base font-semibold text-white">Connect Wallet</span>
            </div>
          </button>

          {/* Internet Identity Button */}
          <button
            onClick={handleInternetIdentityLogin}
            disabled={iiLoading}
            className="group w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-6 py-4 transition-all duration-200 border-2 border-white/30 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ display: 'block', visibility: 'visible', opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-base font-semibold text-white">
                {iiLoading ? 'Authenticating...' : 'Internet Identity'}
              </span>
            </div>
          </button>

          {/* Guest Button */}
          <button
            onClick={handleGuestLogin}
            className="group w-full bg-gray-700 hover:bg-gray-600 rounded-lg px-6 py-4 transition-all duration-200 border-2 border-white/30 hover:border-white/50"
            style={{ display: 'block', visibility: 'visible', opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-white" />
              <span className="text-base font-semibold text-white">Guest Access</span>
            </div>
          </button>
        </div>





        {/* Hidden AppKit Components - triggered by Connect Wallet button */}
        <div style={{ display: 'none' }}>
          <appkit-button />
        </div>
      </div>
    </div>
  );
}
