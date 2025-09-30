// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ConnectWalletModalComponent from '../ui/ConnectWalletModalComponent';
import { startOliviaChat } from '../../utils/olivia';
import { Home, Puzzle, Search, User } from 'lucide-react';

export default function BottomNavigation() {
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

  return (
    <>
      {/* The Connect Wallet Modal */}
      <ConnectWalletModalComponent
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Navigation Bar - Frosted Glass Effect */}
        <nav className="bg-black/80 backdrop-blur-md border-t border-white/20 safe-bottom">
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
    </>
  );
}
