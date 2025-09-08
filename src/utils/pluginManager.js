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
    detailedDescription: 'Lurky is a cutting-edge blockchain intelligence platform that provides real-time analytics across multiple networks. It specializes in tracking token movements, whale activity, and market sentiment analysis to help traders make informed decisions.',
    logo: lurkyCharacter,
    category: 'Analytics',
    color: 'purple'
  },
  coingecko: {
    id: 'coingecko',
    name: 'CoinGecko',
    description: 'Cryptocurrency prices and market data',
    detailedDescription: 'CoinGecko is the world\'s largest independent cryptocurrency data aggregator with over 13,000+ different crypto-assets tracked across 500+ exchanges. It provides comprehensive market data, price charts, and fundamental analysis for the entire crypto ecosystem.',
    logo: coingeckoIcon,
    category: 'Market Data',
    color: 'green'
  },
  coinstats: {
    id: 'coinstats',
    name: 'CoinStats',
    description: 'Portfolio tracking and market analytics',
    detailedDescription: 'CoinStats is a leading cryptocurrency portfolio management platform trusted by over 1 million users worldwide. It offers real-time portfolio tracking, profit/loss analytics, and market insights across 300+ exchanges and 8000+ cryptocurrencies.',
    logo: coinstatsLogo,
    category: 'Market Data',
    color: 'blue'
  },
  icp: {
    id: 'icp',
    name: 'ICP',
    description: 'Internet Computer network status and blockchain data',
    detailedDescription: 'Internet Computer Protocol (ICP) is a revolutionary blockchain that extends the internet with computation. Built by DFINITY, it enables smart contracts to serve web content directly, creating a decentralized alternative to traditional cloud computing.',
    logo: icpLogo,
    category: 'Blockchain',
    color: 'green'
  },
  hedera: {
    id: 'hedera',
    name: 'Hedera',
    description: 'Hedera Hashgraph network data and insights',
    detailedDescription: 'Hedera is an enterprise-grade public network powered by hashgraph consensus. Governed by global organizations like Google, IBM, and Boeing, it offers fast, fair, and secure transactions with low fees and energy efficiency.',
    logo: hederaLogo,
    category: 'Blockchain',
    color: 'green'
  },
  changenow: {
    id: 'changenow',
    name: 'ChangeNOW',
    description: 'Cryptocurrency exchange and swapping services',
    detailedDescription: 'ChangeNOW is a non-custodial cryptocurrency exchange that allows instant crypto swaps without registration. With support for 850+ cryptocurrencies and partnerships with major wallets, it offers fast, secure, and anonymous trading.',
    logo: changeNowLogo,
    category: 'Exchange',
    color: 'orange'
  },
  zerox: {
    id: 'zerox',
    name: '0x Protocol',
    description: 'DEX aggregator for best swap rates',
    detailedDescription: '0x Protocol is the leading DEX aggregation infrastructure that powers decentralized trading across Ethereum and other chains. It sources liquidity from 100+ DEXs to provide the best prices with minimal slippage for token swaps.',
    logo: zeroXLogo,
    category: 'Exchange',
    color: 'purple'
  },
  portfolio: {
    id: 'portfolio',
    name: 'WalletConnect',
    description: 'View connected wallet balance',
    detailedDescription: 'WalletConnect is the leading Web3 communications protocol that connects decentralized applications to mobile wallets. It enables secure wallet connections across 170+ wallets and 400+ apps, powering the multi-chain Web3 ecosystem.',
    logo: walletConnectLogo,
    category: 'Wallet',
    color: 'purple'
  },
  alchemy: {
    id: 'alchemy',
    name: 'Alchemy',
    description: 'Detailed token balances and portfolio analytics',
    detailedDescription: 'Alchemy is the world\'s most powerful blockchain development platform, powering millions of users across 99% of countries worldwide. It provides reliable, scalable blockchain infrastructure and advanced APIs for Web3 applications.',
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
  
  // Default: enable core trading and portfolio plugins
  const defaultEnabledPlugins = ['zerox', 'portfolio', 'coinstats', 'changenow'];
  return Object.keys(AVAILABLE_PLUGINS).reduce((acc, pluginId) => {
    acc[pluginId] = defaultEnabledPlugins.includes(pluginId);
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
