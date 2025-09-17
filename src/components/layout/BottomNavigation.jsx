// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ConnectWalletModalComponent from '../ui/ConnectWalletModalComponent';
import { startOliviaChat } from '../../utils/olivia';


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

  return (
    <>
      {/* The Connect Wallet Modal */}
      <ConnectWalletModalComponent
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40 ">
        {/* Navigation Bar - Taller and Transparent */}
        <nav className="bg-transparent backdrop-blur-sm border-t border-white/10 safe-bottom rounded-t-xl">
          <div className="px-2 py-6">
            <div className="flex justify-center items-center">
              <div className="flex-1 flex flex-col items-center justify-end h-full">
              </div>
            </div>
          </div>
        </nav>
      </div>

    </>
  );
}
