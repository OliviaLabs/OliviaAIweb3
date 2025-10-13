import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';
import { getPluginStates, togglePlugin, enableAllPlugins, disableAllPlugins } from '../utils/pluginManager';

export default function Profile() {
  const { address: wallet, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { userData, setUserData } = useAuth();

  const [nickname, setNickname] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(localStorage.getItem('olivia-selected-plan') || 'free');

  useEffect(() => {
    setNickname(userData?.nickname || userData?.first_name || '');
    setTelegramHandle(localStorage.getItem('profile-telegram') || '');
    setTwitterHandle(localStorage.getItem('profile-twitter') || '');
  }, [userData]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    // Save selected plan to localStorage
    localStorage.setItem('olivia-selected-plan', plan);
    
    // If switching to a plan with fewer plugins, disable excess plugins
    const maxPlugins = plan === 'free' ? 2 : plan === 'starter' ? 4 : plan === 'pro' ? 8 : Infinity;
    const pluginStates = getPluginStates();
    const currentEnabled = Object.entries(pluginStates).filter(([_, enabled]) => enabled);
    
    if (currentEnabled.length > maxPlugins && maxPlugins !== Infinity) {
      // Disable excess plugins (keep the first N enabled)
      const pluginsToDisable = currentEnabled.slice(maxPlugins);
      pluginsToDisable.forEach(([pluginId, _]) => {
        togglePlugin(pluginId);
      });
    }
  };

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

        {/* Plan Selection */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Choose Your Plan</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'free', name: 'Free', price: '$0', plugins: '2 Plugins' },
              { id: 'starter', name: 'Starter', price: '$5', plugins: '4 Plugins' },
              { id: 'pro', name: 'Pro', price: '$10', plugins: '8 Plugins' },
              { id: 'unlimited', name: 'Unlimited', price: '$15', plugins: 'All Plugins' }
            ].map(plan => (
              <div
                key={plan.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <div className="text-center">
                  <h4 className="font-semibold text-white text-sm">{plan.name}</h4>
                  <div className="text-lg font-bold text-white mt-1">{plan.price}</div>
                  <div className="text-xs text-white/70 mt-1">{plan.plugins}</div>
                </div>
              </div>
            ))}
          </div>
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
