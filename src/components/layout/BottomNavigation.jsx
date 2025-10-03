// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ConnectWalletModalComponent from '../ui/ConnectWalletModalComponent';
import { startOliviaChat } from '../../utils/olivia';
import { Home, Puzzle, Search, User } from 'lucide-react';

export default function BottomNavigation({ 
  showInput = false, 
  userInput = '', 
  onInputChange = () => {}, 
  onSendMessage = () => {},
  inputRef = null
}) {
  const { telegramUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  
  // 💬 CHAT DISPLAY STATE - Listen to Home.jsx's chat
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  // Listen for chat updates from Home.jsx
  useEffect(() => {
    const handleChatUpdate = (event) => {
      const { userMessage: msg, aiResponse: response, isTyping } = event.detail;
      if (msg) {
        setUserMessage(msg);
        // Auto-expand when user sends a new message
        setIsChatMinimized(false);
      }
      // Always update AI response (even if empty - this clears it when loading)
      setAiResponse(response || '');
      setIsAiTyping(isTyping || false);
    };
    
    window.addEventListener('chatUpdate', handleChatUpdate);
    return () => window.removeEventListener('chatUpdate', handleChatUpdate);
  }, []);

  // This function handles navigation clicks.
  // If the user is a Telegram user (i.e. hasn't connected a wallet), we show the modal.
  const handleNavigation = (route) => {
    if (telegramUser) {
      setIsConnectModalOpen(true);
    } else {
      navigate(route);
    }
  };

  // Navigation items
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      route: '/home',
      icon: Home,
      isActive: location.pathname === '/home'
    },
    {
      id: 'explore',
      label: 'Explore',
      route: '/explore',
      icon: Search,
      isActive: location.pathname === '/explore'
    },
    {
      id: 'plugins',
      label: 'Plugins',
      route: '/plugins',
      icon: Puzzle,
      isActive: location.pathname === '/plugins'
    }
    ,
    {
      id: 'profile',
      label: 'Profile',
      route: '/profile',
      icon: User,
      isActive: location.pathname === '/profile'
    }
  ];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userInput.trim()) {
      onSendMessage();
    }
  };

  return (
    <>
      {/* The Connect Wallet Modal */}
      <ConnectWalletModalComponent
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 2147483647 }}>
        {/* Unified Module: Messages + AI Input + Navigation Bar */}
        <div className="bg-black/50 backdrop-blur-md">
          
          {/* Minimize/Expand button - centered above chat */}
          {(messages.length > 0 || isAiTyping) && (
            <div className="pt-2 pb-1 flex justify-center">
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="text-white hover:text-green-400 transition-colors"
                title={isChatMinimized ? "Expand chat" : "Minimize chat"}
              >
                <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
                  {isChatMinimized ? (
                    // Up arrow (expand)
                    <path d="M8 0l8 10H0l8-10z" />
                  ) : (
                    // Down arrow (minimize)
                    <path d="M8 10L0 0h16L8 10z" />
                  )}
                </svg>
              </button>
            </div>
          )}
          
          {/* 💬 CHAT MESSAGES - Shows full conversation with fade effect */}
          {messages.length > 0 && !isChatMinimized && (
            <div className="relative">
              {/* Fade gradient at top */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
              
              <div className="px-4 pb-2 space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                  <div 
                    key={msg.timestamp + index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={{
                      animation: 'fadeIn 0.3s ease-in'
                    }}
                  >
                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.type === 'user' 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : 'bg-white/10 border border-white/30'
                    }`}>
                      <div className="text-xs text-green-400 mb-1 flex items-center gap-2">
                        {msg.type === 'ai' && <img src="/Olivia-ai-LOGO.png" alt="Olivia" className="w-4 h-4" />}
                        {msg.type === 'user' ? 'You' : 'Olivia'}
                      </div>
                      <div className="text-white text-sm">{msg.content}</div>
                    </div>
                  </div>
                ))}
                
                {/* AI Typing indicator */}
                {isAiTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-white/10 border border-white/30 rounded-lg px-4 py-2 max-w-[80%]">
                      <div className="text-xs text-green-400 mb-1 flex items-center gap-2">
                        <img src="/Olivia-ai-LOGO.png" alt="Olivia" className="w-4 h-4" />
                        Olivia
                      </div>
                      <div className="text-white text-sm flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{animationDelay: '0.1s'}}>●</span>
                        <span className="animate-bounce" style={{animationDelay: '0.2s'}}>●</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Fade gradient at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>
          )}
          
          {/* AI Input Section */}
          {showInput && (
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-black border border-green-300 rounded-lg text-white text-sm pl-3 pr-12 py-2 text-center focus:outline-none focus:border-green-400"
                  style={{
                    caretColor: 'white'
                  }}
                  placeholder="Ask me anything..."
                />
                {/* Olivia Logo Submit Button */}
                <button
                  onClick={onSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-green-900/30 transition-colors duration-200 flex items-center justify-center border border-green-300/50 hover:border-green-400"
                  disabled={!userInput.trim()}
                >
                  <img
                    src="/Olivia-ai-LOGO.png"
                    alt="Send"
                    className={`w-4 h-4 ${!userInput.trim() ? 'opacity-50' : 'opacity-100'}`}
                  />
                </button>
              </div>
            </div>
          )}
          
          {/* Navigation Bar */}
          <nav className="safe-bottom">
            <div className="px-4 py-3">
              <div className="flex justify-around items-center">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.route)}
                      className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-200 ${
                        item.isActive
                          ? 'text-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
