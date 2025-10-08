import React, { useEffect, useMemo, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { address: wallet, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { userData, setUserData } = useAuth();

  const [nickname, setNickname] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const currentPlan = useMemo(() => (localStorage.getItem('olivia-selected-plan') || 'free'), []);

  useEffect(() => {
    setNickname(userData?.nickname || userData?.first_name || '');
    setTelegramHandle(localStorage.getItem('profile-telegram') || '');
    setTwitterHandle(localStorage.getItem('profile-twitter') || '');
  }, [userData]);

  const saveProfile = () => {
    setUserData(prev => ({ ...(prev || {}), nickname }));
    localStorage.setItem('profile-telegram', telegramHandle);
    localStorage.setItem('profile-twitter', twitterHandle);
  };

  return (
    <div className="flex flex-col gap-6 text-white p-4">
      <h1 className="text-xl font-bold">Profile</h1>

      <div className="grid gap-4">
        {/* Wallet section */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-white/70">Web3 Wallet</span>
            <span className="font-mono text-white text-sm">
              {isConnected && wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Not connected'}
            </span>
          </div>
          <button
            onClick={() => disconnect?.()}
            disabled={!isConnected}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${isConnected ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/50 cursor-not-allowed'}`}
          >
            Disconnect
          </button>
        </div>

        {/* Plan */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-white/70">Current Plan</span>
            <span className="text-white font-medium capitalize">{currentPlan}</span>
          </div>
          <a href="/plugins" className="px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 transition-colors">Manage</a>
        </div>

        {/* Nickname */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <label className="block text-sm text-white/70 mb-2">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your display name"
            className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Telegram handle */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <label className="block text-sm text-white/70 mb-2">Telegram Handle</label>
          <input
            value={telegramHandle}
            onChange={(e) => setTelegramHandle(e.target.value)}
            placeholder="@your_telegram"
            className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Twitter/X handle */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <label className="block text-sm text-white/70 mb-2">Twitter (X) Handle</label>
          <input
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="@your_twitter"
            className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={saveProfile}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
