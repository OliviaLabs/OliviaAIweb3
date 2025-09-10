// src/pages/Login.jsx
import { useAuth } from '../contexts/AuthContext';
import { useInternetIdentity } from '../contexts/InternetIdentityContext';
import Button from '../components/ui/Button';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, Shield, UserCheck, LogOut } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
export default function Login() {
  // Authentication context
  const { setUserAuthenticated, setUserData, loginAsGuest, setIsGuestUser, userAuthenticated, userData, logout } = useAuth();
  const { login: internetIdentityLogin, principal, isLoading: iiLoading, isAuthenticated } = useInternetIdentity();
  const { isConnected, address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const { open } = useAppKit();


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
  }, [isAuthenticated, principal, iiLoading, setUserData, setIsGuestUser, setUserAuthenticated, navigate]);

  // Watch for Web3 wallet connection and auto-login
  useEffect(() => {
    // Check if wallet is connected
    if (isConnected && address) {
      console.log('Web3 wallet connected:', address);
      
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
      
      // Navigate after state is set
      navigate('/home');
    }
  }, [isConnected, address, setUserData, setIsGuestUser, setUserAuthenticated, navigate]);

  // Check for existing authentication on page load
  useEffect(() => {
    if (userAuthenticated && userData) {
      console.log('User already authenticated, redirecting to home');
      navigate('/home');
    }
  }, [userAuthenticated, userData, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center px-8">
        {/* Premium Logo Section */}
        <div className="text-center mb-16">
          <img
            src="/olivia-logo-white.png"
            alt="Olivia AI"
            className="w-auto h-[48px] mb-4 drop-shadow-2xl"
          />
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>
        </div>



        {/* Sleek Login Options */}
        <div className="w-full space-y-2 max-w-sm mx-auto">
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
            className="group w-full bg-gray-900 hover:bg-gray-800 rounded-lg px-4 py-2.5 transition-all duration-200 border border-gray-800 hover:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Connect Wallet</span>
            </div>
          </button>

          {/* Internet Identity Button */}
          <button
            onClick={handleInternetIdentityLogin}
            disabled={iiLoading}
            className="group w-full bg-gray-950 hover:bg-gray-900 rounded-lg px-4 py-2.5 transition-all duration-200 border border-gray-800 hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                {iiLoading ? 'Authenticating...' : 'Internet Identity'}
              </span>
            </div>
          </button>

          {/* Guest Button */}
          <button
            onClick={handleGuestLogin}
            className="group w-full bg-black hover:bg-gray-950 rounded-lg px-4 py-2.5 transition-all duration-200 border border-gray-800 hover:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Guest Access</span>
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
