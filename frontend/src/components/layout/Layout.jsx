import { Outlet, useLocation } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import TopNavigation from './TopNavigation'
import BottomNavigation from './BottomNavigation'
import WelcomeDrawer from '../ui/WelcomeDrawer'
import AccountUpgradePrompt from '../ui/AccountUpgradePrompt'
import ResponsiveHomeWrapper from './ResponsiveHomeWrapper'
import { useAuth } from '../../contexts/AuthContext'
import { useHomeInput } from '../../contexts/HomeInputContext'
import { useAccountUpgrade } from '../../hooks/useAccountUpgrade';
import { log } from '../../utils/logger.js';

export default function Layout() {
  const [showWelcomeDrawer, setShowWelcomeDrawer] = useState(false)
  const location = useLocation()
  // Remove game page logic
  const { telegramUser, setTelegramUser, userData, setUserData, isGuestUser } = useAuth();
  
  // Get AI input state from context
  const { showInput, userInput, setUserInput, inputRef, handleSendMessageRef } = useHomeInput();
  
  // Account upgrade flow
  const { 
    shouldShowUpgrade, 
    dismissUpgradePrompt, 
    handleUpgradeSuccess,
    forceShowUpgrade // Add this function
  } = useAccountUpgrade();

  // Make upgrade function available globally for AI actions
  useEffect(() => {
    window.showICPUpgrade = forceShowUpgrade;
    
    return () => {
      delete window.showICPUpgrade;
    };
  }, [forceShowUpgrade]);

  // Development helper - expose forceShowUpgrade to window for testing
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.forceUpgradePrompt = forceShowUpgrade;
      if (!window._devHelpersLogged) {
        log('🧪 Dev helper: Use window.forceUpgradePrompt() to test upgrade flow');
        window._devHelpersLogged = true;
      }
    }
  }, [forceShowUpgrade]);

  // Reset stale welcome on each page load; use runtime flag for this load
  useEffect(() => {
    try {
      sessionStorage.removeItem('inline_welcome_text');
      window.__inlineWelcomeShown = false;
    } catch (_) {}
  }, []);

  useEffect(() => {
    // Don't show welcome drawer for guest users
    if (isGuestUser) {
      setShowWelcomeDrawer(false)
      return
    }
    
    if (!userData) {
      setShowWelcomeDrawer(false)
      return
    }
    
    // In development, show drawer to everyone if enabled
    // const showInDev = import.meta.env.VITE_SHOW_WELCOME_DRAWER_DEV === 'true'
    let isNewUser
    // TODO: In production, check if user is new - from DB
    if (telegramUser) {
      isNewUser = false
    } else {
      isNewUser = userData.first_user // This should come from your user data/context
    }

    setShowWelcomeDrawer(isNewUser || false)
  }, [userData, telegramUser, isGuestUser])

  // Apply desktop layout to main app pages (Home, Explore, Plugins, Profile)
  const desktopPages = ['/home', '/explore', '/plugins', '/profile'];
  const useDesktopLayout = desktopPages.includes(location.pathname);

  return (
    <div className={`h-screen hide-scrollbar w-full flex flex-col relative`}>
      {/* Top Navigation - Hidden on desktop (≥1024px) for main pages */}
      <div className={useDesktopLayout ? "lg:hidden" : ""}>
        <TopNavigation />
      </div>

      {/* Main content */}
      <main className={`flex-1 ${useDesktopLayout ? 'overflow-hidden p-0' : 'overflow-y-auto px-4'}`}>
        {useDesktopLayout ? (
          <ResponsiveHomeWrapper>
            <Outlet />
          </ResponsiveHomeWrapper>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Bottom Navigation - Always visible */}
      <BottomNavigation 
        showInput={showInput}
        userInput={userInput}
        onInputChange={setUserInput}
        onSendMessage={() => handleSendMessageRef.current?.()}
        inputRef={inputRef}
      />

      {/* Welcome Drawer */}
      < WelcomeDrawer
        isOpen={showWelcomeDrawer}
        onClose={() => setShowWelcomeDrawer(false)}
      />

      {/* Account Upgrade Prompt */}
      <AccountUpgradePrompt
        isOpen={shouldShowUpgrade}
        onClose={dismissUpgradePrompt}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

    </div>
  )
}
