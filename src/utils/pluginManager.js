// Simple plugin management without React context - just localStorage based
import lurkyCharacter from '../assets/lurky-character.png';
import icpLogo from '../assets/icp-logo.jpg';
import hederaLogo from '../assets/hedera-logo.png';
import coingeckoIcon from '../assets/coingecko-icon.png';
import changeNowLogo from '../components/ui/change now .png';
import coinstatsLogo from '../api/services/coinstats-2.png';
import walletConnectLogo from '../assets/wallet-connect.png';
import alchemyLogo from '../assets/alchemy-logo.jpg';
import zeroXLogo from '../assets/0x-logo.png';

// Define available plugins with metadata
export const AVAILABLE_PLUGINS = {
  lurky: {
    id: 'lurky',
    name: 'Lurky',
    description: 'Real-time blockchain analytics and insights',
    logo: lurkyCharacter,
    category: 'Analytics',
    color: 'purple'
  },
  coingecko: {
    id: 'coingecko',
    name: 'CoinGecko',
    description: 'Cryptocurrency prices and market data',
    logo: coingeckoIcon,
    category: 'Market Data',
    color: 'green'
  },
  coinstats: {
    id: 'coinstats',
    name: 'CoinStats',
    description: 'Portfolio tracking and market analytics',
    logo: coinstatsLogo,
    category: 'Market Data',
    color: 'blue'
  },
  icp: {
    id: 'icp',
    name: 'ICP',
    description: 'Internet Computer network status and blockchain data',
    logo: icpLogo,
    category: 'Blockchain',
    color: 'green'
  },
  hedera: {
    id: 'hedera',
    name: 'Hedera',
    description: 'Hedera Hashgraph network data and insights',
    logo: hederaLogo,
    category: 'Blockchain',
    color: 'green'
  },
  changenow: {
    id: 'changenow',
    name: 'ChangeNOW',
    description: 'Cryptocurrency exchange and swapping services',
    logo: changeNowLogo,
    category: 'Exchange',
    color: 'orange'
  },
  zerox: {
    id: 'zerox',
    name: '0x Protocol',
    description: 'DEX aggregator for best swap rates',
    logo: zeroXLogo,
    category: 'Exchange',
    color: 'purple'
  },
  portfolio: {
    id: 'portfolio',
    name: 'WalletConnect',
    description: 'View connected wallet balance',
    logo: walletConnectLogo,
    category: 'Wallet',
    color: 'purple'
  },
  alchemy: {
    id: 'alchemy',
    name: 'Alchemy',
    description: 'Detailed token balances and portfolio analytics',
    logo: alchemyLogo,
    category: 'Analytics',
    color: 'blue'
  }
};

// Get current plugin states from localStorage
export const getPluginStates = () => {
  try {
    const saved = localStorage.getItem('olivia-plugin-preferences');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to parse saved plugin preferences:', error);
  }
  
  // Default: all plugins disabled
  return Object.keys(AVAILABLE_PLUGINS).reduce((acc, pluginId) => {
    acc[pluginId] = false;
    return acc;
  }, {});
};

// Save plugin states to localStorage
export const savePluginStates = (states) => {
  try {
    localStorage.setItem('olivia-plugin-preferences', JSON.stringify(states));
  } catch (error) {
    console.warn('Failed to save plugin preferences:', error);
  }
};

// Check if a specific plugin is enabled
export const isPluginEnabled = (pluginId) => {
  const states = getPluginStates();
  return states[pluginId] || false;
};

// Toggle a specific plugin
export const togglePlugin = (pluginId) => {
  const states = getPluginStates();
  states[pluginId] = !states[pluginId];
  savePluginStates(states);
  return states[pluginId];
};

// Enable a plugin
export const enablePlugin = (pluginId) => {
  const states = getPluginStates();
  states[pluginId] = true;
  savePluginStates(states);
};

// Disable a plugin
export const disablePlugin = (pluginId) => {
  const states = getPluginStates();
  states[pluginId] = false;
  savePluginStates(states);
};

// Get enabled plugins count
export const getPluginCounts = () => {
  const states = getPluginStates();
  const enabled = Object.values(states).filter(Boolean).length;
  const total = Object.keys(AVAILABLE_PLUGINS).length;
  return { enabled, disabled: total - enabled, total };
};

// Enable all plugins
export const enableAllPlugins = () => {
  const states = {};
  Object.keys(AVAILABLE_PLUGINS).forEach(id => {
    states[id] = true;
  });
  savePluginStates(states);
};

// Disable all plugins
export const disableAllPlugins = () => {
  const states = {};
  Object.keys(AVAILABLE_PLUGINS).forEach(id => {
    states[id] = false;
  });
  savePluginStates(states);
};
