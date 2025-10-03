import { Outlet, useLocation } from 'react-router-dom'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import TopNavigation from './TopNavigation'
import BottomNavigation from './BottomNavigation'
import WelcomeDrawer from '../ui/WelcomeDrawer'
import AccountUpgradePrompt from '../ui/AccountUpgradePrompt'
import { useAuth } from '../../contexts/AuthContext'
import { useHomeInput } from '../../contexts/HomeInputContext'
import { useAccountUpgrade } from '../../hooks/useAccountUpgrade';
import { OPENAI_MICROSERVICE_CONFIG } from '../../api/config/endpoints.js';
import { log, error as logError } from '../../utils/logger.js';

export default function Layout() {
  const [showWelcomeDrawer, setShowWelcomeDrawer] = useState(false)
  const location = useLocation()
  // Remove game page logic
  const { telegramUser, setTelegramUser, userData, setUserData, isGuestUser } = useAuth();
  
  // Get AI input state from context
  const { showInput, setShowInput, userInput, setUserInput, inputRef, handleSendMessageRef } = useHomeInput();
  
  // 💬 CHAT STATE - Now lives at Layout level for all pages
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Account upgrade flow
  const { 
    shouldShowUpgrade, 
    dismissUpgradePrompt, 
    handleUpgradeSuccess,
    forceShowUpgrade // Add this function
  } = useAccountUpgrade();

  // 💬 HANDLE SENDING MESSAGES TO AI (Direct OpenAI HTTP call)
  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isLoading) return;
    
    const message = userInput.trim();
    
    log('💬 Layout: Sending message:', message);
    
    // Add user message to conversation
    setMessages(prev => [...prev, { type: 'user', content: message }]);
    setUserInput('');
    setIsLoading(true);
    setCurrentResponse('');
    
    try {
      // Build conversation history in OpenAI format
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Add current message
      conversationHistory.push({
        role: 'user',
        content: message
      });
      
      log('📤 Calling OpenAI API directly');
      
      // Call OpenAI API directly via HTTP
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/openai/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`
        },
        body: JSON.stringify({
          messages: conversationHistory,
          contextAwarenessData: window.contextAwarenessData || {}
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || data.message || 'Sorry, I couldn\'t process that.';
      
      log('✅ AI response received:', aiResponse.substring(0, 50) + '...');
      
      // Add AI response to conversation
      setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
      setIsLoading(false);
      
    } catch (error) {
      logError('❌ Failed to send message:', error);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: 'Sorry, I\'m having trouble connecting to my AI service right now. Please try again in a moment!' 
      }]);
      setIsLoading(false);
    }
  }, [userInput, isLoading, messages, setUserInput]);
  
  // Wire up the handleSendMessageRef so BottomNavigation can call it
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
    log('✅ Chat system initialized - works on ALL pages!');
  }, [handleSendMessage]);

  // 📡 LISTEN FOR INTRO MESSAGES FROM HOME.JSX
  useEffect(() => {
    const handleIntroMessage = (event) => {
      log('📩 Layout received intro message:', event.detail.message);
      setMessages([{
        type: 'ai',
        content: event.detail.message
      }]);
    };
    
    window.addEventListener('addIntroMessage', handleIntroMessage);
    return () => window.removeEventListener('addIntroMessage', handleIntroMessage);
  }, []);

  // 📡 BROADCAST CHAT STATE TO BOTTOM NAVIGATION
  useEffect(() => {
    // Get latest user message
    const userMessages = messages.filter(m => m.type === 'user');
    const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
    
    // Get the AI response that comes AFTER the latest user message
    let latestAiResponse = '';
    if (!isLoading && userMessages.length > 0) {
      const lastUserIndex = messages.findLastIndex(m => m.type === 'user');
      const aiMessagesAfterUser = messages.slice(lastUserIndex + 1).filter(m => m.type === 'ai');
      if (aiMessagesAfterUser.length > 0) {
        latestAiResponse = aiMessagesAfterUser[aiMessagesAfterUser.length - 1].content;
      }
    } else if (!isLoading && messages.length > 0) {
      // No user messages yet, show initial AI greeting if any
      const aiMessages = messages.filter(m => m.type === 'ai');
      if (aiMessages.length > 0) {
        latestAiResponse = aiMessages[aiMessages.length - 1].content;
      }
    }
    
    // Broadcast to BottomNavigation
    window.dispatchEvent(new CustomEvent('chatUpdate', {
      detail: {
        userMessage: latestUserMessage,
        aiResponse: latestAiResponse,
        isTyping: isLoading
      }
    }));
  }, [messages, isLoading]);

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

  return (
    <div className={`h-screen hide-scrollbar w-full flex flex-col relative`}>
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main content */}
      <main className={`flex-1 px-4 overflow-y-auto`}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
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
