// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import React, { useState } from 'react';
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

      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Unified Module: AI Input + Navigation Bar */}
        <div className="bg-black/50 backdrop-blur-md border-t border-white/20">
          
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

          {/* Thin white line separator */}
          {showInput && (
            <div className="border-t border-white/20 mx-4"></div>
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
