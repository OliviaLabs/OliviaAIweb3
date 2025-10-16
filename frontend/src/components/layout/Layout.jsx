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

  // Desktop page needs full-screen layout without padding
  const isDesktopPage = location.pathname === '/desktop';

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Main content - fills the right column */}
      <main className={`flex-1 w-full ${isDesktopPage ? 'overflow-hidden p-0' : 'overflow-y-auto px-4'}`} style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
        <ResponsiveHomeWrapper>
          <Outlet />
        </ResponsiveHomeWrapper>
      </main>

      {/* Bottom Navigation with AI Chat - Constrained to right column */}
      <div className="flex-shrink-0 relative" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <BottomNavigation
          showInput={showInput}
          userInput={userInput}
          onInputChange={setUserInput}
          onSendMessage={() => handleSendMessageRef.current?.()}
          inputRef={inputRef}
        />
      </div>

      {/* Welcome Drawer */}
      <WelcomeDrawer
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
