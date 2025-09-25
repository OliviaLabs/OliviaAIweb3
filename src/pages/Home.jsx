import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useInternetIdentity } from '../contexts/InternetIdentityContext'
import { isPluginEnabled, AVAILABLE_PLUGINS } from '../utils/pluginManager'
import { useAccountUpgrade } from '../hooks/useAccountUpgrade';
import { icpService } from '../api/services/icp.service.js';
import { lurkyService, coingeckoService, coinstatsService, hgraphService, changeNowService } from '../api';
import { twitterService } from '../api/services/twitter.service.js';
import protokolsService from '../api/services/protokols.service.js';
import { OPENAI_MICROSERVICE_CONFIG } from '../api/config/endpoints.js';
import { log, error as logError } from '../utils/logger.js';
import FloatingLurkyBubble from '../components/ui/FloatingLurkyBubble.jsx';
import FloatingCoinGeckoBubble from '../components/ui/FloatingCoinGeckoBubble.jsx';
import FloatingCoinStatsBubble from '../components/ui/FloatingCoinStatsBubble.jsx';
import FloatingICPBubble from '../components/ui/FloatingICPBubble.jsx';
import FloatingHederaBubble from '../components/ui/FloatingHederaBubble.jsx';
import FloatingChangeNowBubble from '../components/ui/FloatingChangeNowBubble.jsx';
import FloatingPortfolioBubble from '../components/ui/FloatingPortfolioBubble.jsx';
import FloatingAlchemyBubble from '../components/ui/FloatingAlchemyBubble.jsx';
import FloatingWebSearchBubble from '../components/ui/FloatingWebSearchBubble.jsx';
import FloatingNewsBubble from '../components/ui/FloatingNewsBubble.jsx';
import FloatingTwitterBubble from '../components/ui/FloatingTwitterBubble.jsx';
import FloatingProtokolsBubble from '../components/ui/FloatingProtokolsBubble.jsx';
import FloatingZeroXBubble from '../components/ui/FloatingZeroXBubble.jsx';
import FloatingOKXBubble from '../components/ui/FloatingOKXBubble.jsx';
import FloatingTONCenterBubble from '../components/ui/FloatingTONCenterBubble.jsx';
import FloatingChainbaseBubble from '../components/ui/FloatingChainbaseBubble.jsx';
import InAppBrowser from '../components/ui/InAppBrowser.jsx';

export default function Home() {
  const [messages, setMessages] = useState([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const messagesEndRef = useRef(null)
  const [userInput, setUserInput] = useState('')
  const [loadingText, setLoadingText] = useState('Analyzing')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])
  // Multiple bubble instances - arrays instead of single states
  const [lurkyBubbles, setLurkyBubbles] = useState([])
  const [coinGeckoBubbles, setCoinGeckoBubbles] = useState([])
  const [coinstatsBubbles, setCoinstatsBubbles] = useState([])
  const [icpBubbles, setIcpBubbles] = useState([])
  const [hederaBubbles, setHederaBubbles] = useState([])
  const [changeNowBubbles, setChangeNowBubbles] = useState([])
  const [zeroXBubbles, setZeroXBubbles] = useState([])
  const [okxBubbles, setOkxBubbles] = useState([])
  const [tonCenterBubbles, setTonCenterBubbles] = useState([])
  const [chainbaseBubbles, setChainbaseBubbles] = useState([])
  const [portfolioBubbles, setPortfolioBubbles] = useState([])
  const [alchemyBubbles, setAlchemyBubbles] = useState([])
  const [webSearchBubbles, setWebSearchBubbles] = useState([])
  const [newsBubbles, setNewsBubbles] = useState([])
  const [twitterBubbles, setTwitterBubbles] = useState([])
  const [protokolsBubbles, setProtokolsBubbles] = useState([])

  // Context awareness data for AI chat
  const [contextAwarenessData, setContextAwarenessData] = useState({
    market_data: {},
    sentiment_data: {},
    exchange_data: {},
    blockchain_data: {},
    portfolio_data: {},
    last_updated: null
  })

  // Sync local context data to window for AI access
  useEffect(() => {
    window.contextAwarenessData = contextAwarenessData;
    console.log('🧠 Synced context data to window:', contextAwarenessData);
  }, [contextAwarenessData])

  // In-app browser state
  const [browserOpen, setBrowserOpen] = useState(false)
  const [browserUrl, setBrowserUrl] = useState('')

  // Debug browser state changes
  useEffect(() => {
    log('🔗 Browser state changed:', { browserOpen, browserUrl })
  }, [browserOpen, browserUrl])

  // Handle opening URLs in in-app browser
  const handleUrlClick = useCallback((url) => {
    // Unescape any HTML entities that might have been escaped for onclick
    let cleanUrl = url.replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    
    log('🔗 URL click triggered with:', url)
    log('🔗 Cleaned URL:', cleanUrl)
    
    // Fix common CoinGecko URL issues
    if (cleanUrl.includes('coingecko.com')) {
      // Remove /usd suffix if present (incorrect format)
      cleanUrl = cleanUrl.replace(/\/usd(\?|$)/, '$1')
      // Ensure proper format: /en/coins/token-name
      cleanUrl = cleanUrl.replace(/\/en\/coins\/([^/?]+).*/, '/en/coins/$1')
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://www.coingecko.com' + cleanUrl
      }
    }
    
    log('🔗 Final URL for browser:', cleanUrl)
    log('🔗 Setting browserOpen to true')
    setBrowserUrl(cleanUrl)
    setBrowserOpen(true)
  }, [])

  // Handle closing in-app browser
  const handleCloseBrowser = useCallback(() => {
    setBrowserOpen(false)
    setBrowserUrl('')
  }, [])

  // Make handleUrlClick globally available for onclick handlers
  useEffect(() => {
    window.handleUrlClick = handleUrlClick
    return () => {
      delete window.handleUrlClick
    }
  }, [handleUrlClick])

  // Add event delegation for URL clicks to handle dangerouslySetInnerHTML links
  useEffect(() => {
    const handleDocumentClick = (event) => {
      // Check if clicked element is one of our generated links
      if (event.target.tagName === 'A' && event.target.id?.startsWith('link_')) {
        event.preventDefault();
        const href = event.target.getAttribute('data-url');
        if (href && handleUrlClick) {
          log('🔗 Link clicked via event delegation:', href);
          handleUrlClick(href);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [handleUrlClick])

  // Helper function to update context awareness data
  const updateContextAwareness = useCallback((category, token, data) => {
    // Check which plugin this data is from and if it's enabled
    const sourcePlugin = data?.source?.toLowerCase();
    let shouldUpdate = true;
    
    // Map data sources to plugin IDs
    const sourceToPlugin = {
      'lurky': 'lurky',
      'coingecko': 'coingecko',
      // 'coinstats': 'coinstats', // DISABLED
      // 'coinstats (olivia thought)': 'coinstats', // DISABLED
      'hgraph': 'hedera',
      'hedera': 'hedera',
      'changenow': 'changenow',
      '0x protocol': 'zerox',
      'icp': 'icp',
      'portfolio': 'portfolio'
    };
    
    // Check if the plugin for this data source is enabled
    if (sourcePlugin && sourceToPlugin[sourcePlugin]) {
      shouldUpdate = isPluginEnabled(sourceToPlugin[sourcePlugin]);
    }
    
    // Only update context if the plugin is enabled
    if (shouldUpdate) {
      setContextAwarenessData(prev => {
        const newData = {
          ...prev,
          [category]: {
            ...prev[category],
            [token]: {
              data: data,
              timestamp: new Date().toISOString()
            }
          },
          last_updated: new Date().toISOString()
        };
        // Make it globally available for WebSocket context
        window.contextAwarenessData = newData;
        return newData;
      });
    } else {
      log(`📵 Skipping context update from disabled plugin: ${sourcePlugin}`);
    }
  }, [])

  const inputRef = useRef(null)
  const { userData, isGuestUser } = useAuth()
  const { isConnected, sendMessage, subscribe, connect, isConnecting, connectionAttempts, currentEndpointIndex, wsEndpoints } = useWebSocket()
  const { principal, isAuthenticated } = useInternetIdentity()
  const { forceShowUpgrade } = useAccountUpgrade(); // ICP upgrade

  // Auto-fetch portfolio data when wallet connects
  const [portfolioFetched, setPortfolioFetched] = useState(new Set()); // Track fetched addresses
  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    let mounted = true;
    const walletAddress = userData?.wallet_address;
    
    if (walletAddress && walletAddress !== '0x0' && mounted && !portfolioFetched.has(walletAddress)) {
      console.log('💰 Wallet connected, auto-fetching portfolio data for:', walletAddress);
      setPortfolioFetched(prev => new Set([...prev, walletAddress])); // Mark as fetching
      
      // Fetch portfolio data immediately without showing bubble
      (async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/portfolio/${walletAddress}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              // Update context with portfolio data
              const portfolioContext = {
                portfolio_data: {
                  wallet_address: walletAddress,
                  total_tokens: data.totalTokens,
                  tokens: data.data || [],
                  timestamp: new Date().toISOString(),
                  source: 'Auto-fetch on wallet connect',
                  has_wallet_connected: true
                }
              };
              
              // Update global context
              window.contextAwarenessData = {
                ...window.contextAwarenessData,
                ...portfolioContext
              };
              
              // Update local state
              setContextAwarenessData(prev => ({
                ...prev,
                ...portfolioContext
              }));
              
              console.log('💰 Auto-loaded portfolio data:', portfolioContext);
              console.log('💰 Tokens found:', data.data?.length || 0);
            }
          }
        } catch (error) {
          console.error('Failed to auto-fetch portfolio:', error);
        }
      })();
    }
    
    return () => {
      mounted = false;
    }
  }, [userData?.wallet_address, portfolioFetched]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Initialize particles
  useEffect(() => {
    const createParticles = () => {
      const newParticles = []
      for (let i = 0; i < 15; i++) { // Reduced to 15 background particles
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          size: Math.random() * 2 + 1.5,
          life: Infinity, // Background particles live forever
          createdAt: Date.now()
        })
      }
      setParticles(newParticles)
    }
    
    createParticles()
    window.addEventListener('resize', createParticles)
    return () => window.removeEventListener('resize', createParticles)
  }, [])

  // Animate particles with performance optimizations
  useEffect(() => {
    let frameId;
    const MAX_PARTICLES = 100; // Hard limit on particles
    const PARTICLE_LIFETIME = 8000; // 8 seconds for pop particles
    
    const animateParticles = () => {
      setParticles(prev => {
        const now = Date.now();
        
        // Clean up old particles and enforce limits
        let aliveParticles = prev.filter(particle => 
          particle.life === Infinity || (now - particle.createdAt < particle.life)
        );
        
        // If we have too many particles, remove oldest non-background particles first
        if (aliveParticles.length > MAX_PARTICLES) {
          const backgroundParticles = aliveParticles.filter(p => p.life === Infinity);
          const popParticles = aliveParticles.filter(p => p.life !== Infinity)
            .sort((a, b) => a.createdAt - b.createdAt) // Oldest first
            .slice(0, MAX_PARTICLES - backgroundParticles.length);
          
          aliveParticles = [...backgroundParticles, ...popParticles];
        }
        
        // Simplified physics - only calculate mouse attraction for nearby particles
        return aliveParticles.map(particle => {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distanceSquared = dx * dx + dy * dy; // Skip expensive sqrt
          
          let attractionX = 0, attractionY = 0;
          
          // Only apply attraction if particle is within reasonable distance (performance boost)
          if (distanceSquared < 40000) { // ~200px radius
            const distance = Math.sqrt(distanceSquared);
            const force = Math.min(distance / 200, 1.5);
            attractionX = distance > 0 ? (dx / distance) * force * 0.03 : 0;
            attractionY = distance > 0 ? (dy / distance) * force * 0.03 : 0;
          }
          
          // Simpler random movement
          const randomX = (Math.random() - 0.5) * 0.2;
          const randomY = (Math.random() - 0.5) * 0.2;
          
          // Update velocity with damping
          const newVx = (particle.vx + attractionX + randomX) * 0.92;
          const newVy = (particle.vy + attractionY + randomY) * 0.92;
          
          // Update position
          let newX = particle.x + newVx;
          let newY = particle.y + newVy;
          
          // Simplified boundary handling
          if (newX < 0) newX = window.innerWidth;
          else if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          else if (newY > window.innerHeight) newY = 0;
          
          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });
      });
      
      frameId = requestAnimationFrame(animateParticles);
    };
    
    frameId = requestAnimationFrame(animateParticles);
    return () => cancelAnimationFrame(frameId);
  }, [mousePos])

  // Function to add particles to the main swarm (for bubble pops)
  const addParticlesToSwarm = (newParticles) => {
    setParticles(prev => {
      const now = Date.now();
      
      // Convert pop particles to swarm particles with lifecycle
      const swarmParticles = newParticles.map((particle, index) => ({
        id: now + index + Math.random(), // Unique ID
        x: particle.x,
        y: particle.y,
        vx: particle.vx * 0.15, // Reduced initial velocity for smoother integration
        vy: particle.vy * 0.15,
        size: particle.size,
        life: 6000, // Pop particles live for 6 seconds
        createdAt: now
      }));
      
      return [...prev, ...swarmParticles];
    });
  };

  // Cycling loading text
  useEffect(() => {
    if (!isLoading) return
    
    const loadingStates = ['Analyzing', 'Researching', 'Processing', 'Searching', 'Thinking']
    let currentIndex = 0
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingStates.length
      setLoadingText(loadingStates[currentIndex])
    }, 800)
    
    return () => clearInterval(interval)
  }, [isLoading])

  // Parse AI responses for coin mentions and show bubbles - DYNAMIC EXTRACTION
  const parseAIResponseForCoins = useCallback(async (aiMessage) => {
    log('🤖 AI Agent: Extracting potential tokens from:', aiMessage)
    console.log('🤖 AI RESPONSE PARSING:', aiMessage)
    
    // PRECISE TOKEN EXTRACTION - Only extract actual crypto tokens, not random words
    const extractPotentialTokens = (text) => {
      const candidates = new Set();
      
      // Pattern 1: Explicit token mentions with $ prefix - "$PEPE", "$BTC", "$TON"
      const dollarTokens = text.match(/\$[A-Za-z]{2,15}\b/g) || [];
      dollarTokens.forEach(token => {
        candidates.add(token.substring(1).toLowerCase()); // Remove $ prefix
      });
      
      // Pattern 2: ALL CAPS tokens (3-6 chars) - "TON", "BTC", "ETH" 
      const capTokens = text.match(/\b[A-Z]{3,6}\b/g) || [];
      capTokens.forEach(token => {
        // Only exclude the most obvious English words
        const obviousWords = ['THE', 'AND', 'FOR', 'YOU', 'ARE', 'CAN', 'NOT', 'BUT', 'ALL', 'GET', 'NEW', 'NOW', 'WAY', 'USE', 'HAS', 'HAD', 'WHO', 'HIS', 'HER', 'HIM', 'SHE', 'DAY', 'OLD', 'SEE', 'TWO', 'HOW', 'ITS', 'OUR', 'OUT', 'DID', 'GOT', 'MAN', 'PUT', 'SAY', 'TOO', 'ANY', 'OFF', 'FAR', 'OWN', 'SET', 'TRY', 'ASK', 'LET', 'RUN', 'SIT', 'WIN', 'YES', 'YET', 'API', 'URL', 'HTTP', 'JSON', 'HTML', 'CSS', 'SQL', 'USD', 'EUR', 'GBP'];
        if (!obviousWords.includes(token)) {
          candidates.add(token.toLowerCase());
        }
      });
      
      // Pattern 3: Token names in parentheses - "Aster (ASTER)", "Bitcoin (BTC)", "Hyperliquid (HYPE)"
      const parenTokens = text.match(/\b[A-Za-z]+\s*\([A-Z]{2,10}\)/g) || [];
      console.log('🔍 Found parentheses tokens:', parenTokens);
      parenTokens.forEach(match => {
        const symbol = match.match(/\(([A-Z]{2,10})\)/);
        const name = match.match(/^([A-Za-z]+)/);
        if (symbol) {
          candidates.add(symbol[1].toLowerCase()); // Always add the symbol from parentheses
        }
        if (name && name[1].length >= 3) {
          const tokenName = name[1].toLowerCase();
          // Add any capitalized name that's likely a token
          candidates.add(tokenName);
        }
      });
      
      // Pattern 4: Direct mentions of known crypto tokens ONLY
      const knownCryptoTokens = ['ton', 'toncoin', 'btc', 'bitcoin', 'eth', 'ethereum', 'sol', 'solana', 'ada', 'cardano', 'dot', 'polkadot', 'link', 'chainlink', 'uni', 'uniswap', 'avax', 'avalanche', 'matic', 'polygon', 'atom', 'cosmos', 'near', 'algo', 'algorand', 'fil', 'filecoin', 'icp', 'hbar', 'hedera', 'vet', 'vechain', 'trx', 'tron', 'xlm', 'stellar', 'xrp', 'ripple', 'bnb', 'binance', 'doge', 'dogecoin', 'shib', 'shiba', 'pepe', 'usdc', 'usdt', 'dai', 'busd', 'mkr', 'maker', 'comp', 'compound', 'aave', 'snx', 'synthetix', 'crv', 'curve', 'bal', 'balancer', 'yfi', 'sushi', 'sushiswap', 'cake', 'pancakeswap'];
      
      const words = text.toLowerCase().match(/\b[a-z]{3,12}\b/g) || [];
      words.forEach(word => {
        if (knownCryptoTokens.includes(word)) {
          candidates.add(word);
        }
      });
      
      const candidateArray = Array.from(candidates);
      console.log('🎯 All extracted candidates:', candidateArray);
      
      // Priority sort: $ prefixed tokens first, then capitalized, then known tokens
      const prioritized = candidateArray.sort((a, b) => {
        // Check if originally had $ prefix
        const aWasDollar = text.includes(`$${a.toUpperCase()}`) || text.includes(`$${a}`);
        const bWasDollar = text.includes(`$${b.toUpperCase()}`) || text.includes(`$${b}`);
        if (aWasDollar && !bWasDollar) return -1;
        if (bWasDollar && !aWasDollar) return 1;
        
        // Check if originally was capitalized
        const aWasCap = text.includes(a.toUpperCase());
        const bWasCap = text.includes(b.toUpperCase());
        if (aWasCap && !bWasCap) return -1;
        if (bWasCap && !aWasCap) return 1;
        
        // Shorter tokens first (likely symbols)
        return a.length - b.length;
      });
      
      return prioritized;
    };
    
    // Extract all potential token candidates
    const potentialTokens = extractPotentialTokens(aiMessage);
    log('🔍 AI Agent found potential tokens:', potentialTokens);
    console.log('🎯 FINAL EXTRACTED TOKENS:', potentialTokens);
    console.log('🎯 AI MESSAGE BEING PARSED:', aiMessage.substring(0, 500));
    
    // Skip API validation for trending responses to prevent flooding
    const isTrendingResponse = aiMessage.toLowerCase().includes('trending') || aiMessage.includes('**') || potentialTokens.length > 3;
    
    if (isTrendingResponse) {
      console.log('🦎 Skipping individual token validation for trending response to prevent API flooding');
      return; // Don't create individual bubbles for trending - use the trending endpoint instead
    }
    
    // DYNAMIC API VALIDATION - Test each candidate against CoinStats API
    const validatedTokens = [];
    const maxTokensToTest = Math.min(potentialTokens.length, 2); // Limit to 2 tokens max
    const tokensToTest = potentialTokens.slice(0, maxTokensToTest);
    
    log('🧪 AI Agent: Testing tokens against CoinStats API...', tokensToTest);
    
    // Test each potential token in parallel using REAL API validation
    const validationPromises = tokensToTest.map(async (token) => {
      try {
        log(`🔎 Testing token: ${token}`);
        
        // UNIVERSAL TOKEN VALIDATION - Try CoinStats API first
        try {
          const searchData = await coinstatsService.searchCoins(token);
          if (searchData && searchData.length > 0) {
            const coinData = searchData[0]; // Take first result
            log(`✅ Found valid token via CoinStats: ${token} -> ${coinData.name}`);
            return {
              searchTerm: token,
              coinData: coinData,
              isValid: true,
              source: 'coinstats'
            };
          } else if (searchData && searchData.length === 0) {
            log(`ℹ️ CoinStats: No results for ${token}, trying fallback`);
            // Fall through to CoinGecko fallback
          }
        } catch (coinstatsError) {
          log(`⚠️ CoinStats API error for ${token}:`, coinstatsError.message);
          // Don't log full error details for 400s, just continue to fallback
          // Fall through to CoinGecko fallback
        }
        
        // FALLBACK: Try CoinGecko API for validation with proper ID mapping
        try {
          // Map common symbols to CoinGecko IDs
          const geckoIdMap = {
            'btc': 'bitcoin',
            'bitcoin': 'bitcoin',
            'eth': 'ethereum', 
            'ethereum': 'ethereum',
            'usdc': 'usd-coin',
            'usdt': 'tether',
            'bnb': 'binancecoin',
            'sol': 'solana',
            'solana': 'solana',
            'ada': 'cardano',
            'cardano': 'cardano',
            'dot': 'polkadot',
            'polkadot': 'polkadot',
            'link': 'chainlink',
            'chainlink': 'chainlink',
            'avax': 'avalanche-2',
            'avalanche': 'avalanche-2',
            'matic': 'matic-network',
            'polygon': 'matic-network',
            'atom': 'cosmos',
            'cosmos': 'cosmos',
            'near': 'near',
            'algo': 'algorand',
            'algorand': 'algorand',
            'icp': 'internet-computer',
            'hbar': 'hedera-hashgraph',
            'hedera': 'hedera-hashgraph',
            'ton': 'the-open-network',
            'toncoin': 'the-open-network',
            'doge': 'dogecoin',
            'dogecoin': 'dogecoin',
            'shib': 'shiba-inu',
            'shiba': 'shiba-inu',
            'pepe': 'pepe'
          };
          
          const geckoId = geckoIdMap[token.toLowerCase()] || token.toLowerCase();
          const geckoData = await coingeckoService.getPrices([geckoId]);
          
          if (Object.keys(geckoData).length > 0) {
            log(`✅ Found valid token via CoinGecko: ${token} -> ${geckoId}`);
            return {
              searchTerm: token,
              coinData: { name: token.toUpperCase(), symbol: token.toUpperCase(), id: geckoId },
              isValid: true,
              source: 'coingecko'
            };
          }
        } catch (geckoError) {
          log(`⚠️ CoinGecko API error for ${token}:`, geckoError);
        }
        
        // FINAL FALLBACK: Check against a minimal common token list (only for well-known ones)
        const wellKnownTokens = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'bnb', 'binance', 'usdc', 'usdt', 'doge', 'dogecoin', 'pepe', 'shib', 'shiba', 'ada', 'cardano', 'dot', 'polkadot', 'link', 'chainlink', 'avax', 'avalanche', 'matic', 'polygon', 'atom', 'cosmos', 'near', 'algo', 'algorand', 'icp', 'hbar', 'hedera', 'ton', 'toncoin', 'aster', 'synd', 'syndicate', 'hype', 'hyperliquid', 'linea'];
        if (wellKnownTokens.includes(token.toLowerCase())) {
          log(`✅ Found valid token (well-known fallback): ${token}`);
          return {
            searchTerm: token,
            coinData: { name: token.toUpperCase(), symbol: token.toUpperCase() },
            isValid: true,
            source: 'fallback'
          };
        }
        
        log(`❌ Token not found in any source: ${token}`);
        return { searchTerm: token, isValid: false };
        
      } catch (error) {
        log(`⚠️ General error testing token ${token}:`, error);
        return { searchTerm: token, isValid: false };
      }
    });
    
    // Wait for all validations to complete
    const validationResults = await Promise.all(validationPromises);
    const validTokens = validationResults.filter(result => result.isValid);
    
    log('🎯 AI Agent: Valid tokens found:', validTokens.map(t => `${t.searchTerm} -> ${t.coinData?.name}`));
    
    // If no tokens found, send instruction message to AI context
    if (validTokens.length === 0 && potentialTokens.length === 0) {
      // Update context with instruction for user
      updateContextAwareness('ai_instruction', 'no_tokens_found', {
        message: 'TYPE THE TOKEN NAME OR SYMBOL IN CAPITAL LETTERS',
        suggestion: 'For example: BTC, ETH, SOL, TON, PEPE, DOGE, etc.',
        timestamp: new Date().toISOString(),
        oneTime: true // This instruction should only show once
      });
      
      log('💡 AI Agent: No tokens detected - instruction added to context');
    } else if (validTokens.length > 0) {
      // Clear the instruction if tokens were found
      if (window.contextAwarenessData?.ai_instruction?.no_tokens_found) {
        delete window.contextAwarenessData.ai_instruction.no_tokens_found;
        log('💡 AI Agent: Tokens found - cleared no tokens instruction');
      }
    }
    
    // Process each validated token (limit to first 4 to avoid spam)
    const tokensToProcess = validTokens.slice(0, 4);
    
    for (const tokenResult of tokensToProcess) {
      const { searchTerm, coinData } = tokenResult;
      log(`🚀 Creating bubble for validated token: ${searchTerm} -> ${coinData.name}`);
      
      // Create CoinGecko bubble for tokens mentioned by AI
      if (isPluginEnabled('coingecko')) {
        // Map token names to CoinGecko IDs (comprehensive mapping)
        const tokenIdMap = {
          'btc': 'bitcoin',
          'bitcoin': 'bitcoin',
          'eth': 'ethereum', 
          'ethereum': 'ethereum',
          'usdc': 'usd-coin',
          'usdt': 'tether',
          'bnb': 'binancecoin',
          'sol': 'solana',
          'solana': 'solana',
          'ada': 'cardano',
          'cardano': 'cardano',
          'dot': 'polkadot',
          'polkadot': 'polkadot',
          'link': 'chainlink',
          'chainlink': 'chainlink',
          'avax': 'avalanche-2',
          'avalanche': 'avalanche-2',
          'matic': 'matic-network',
          'polygon': 'matic-network',
          'atom': 'cosmos',
          'cosmos': 'cosmos',
          'near': 'near',
          'algo': 'algorand',
          'algorand': 'algorand',
          'icp': 'internet-computer',
          'hbar': 'hedera-hashgraph',
          'hedera': 'hedera-hashgraph',
          'ton': 'the-open-network',
          'toncoin': 'the-open-network',
          'doge': 'dogecoin',
          'dogecoin': 'dogecoin',
          'shib': 'shiba-inu',
          'shiba': 'shiba-inu',
          'pepe': 'pepe',
          'css': 'cyrus-sargon',
          'dk': 'disco-kitus',
          // Add trending tokens
          'aster': 'aster',
          'safepal': 'safepal',
          'sfp': 'safepal',
          'hyperliquid': 'hyperliquid',
          'hype': 'hyperliquid',
          'bless': 'bless',
          'hemi': 'hemi-network'
        };
        
        const geckoId = tokenIdMap[searchTerm.toLowerCase()] || searchTerm.toLowerCase();
        
        const coingeckoBubble = {
          id: Date.now() + Math.random() + Math.random(),
          title: `${searchTerm.toUpperCase()} Data`,
          content: `Loading ${searchTerm} data...`,
          loading: true,
          intent: 'PRICE',
          token: geckoId
        };
        
        setCoinGeckoBubbles(prev => [...prev, coingeckoBubble]);
      
        // We already have the coin data from validation, so format it for display
        const change = coinData.priceChange1d || 0;
        const changeDirection = change > 0 ? '+' : '';
        
        // Safe price formatting with null checks
        let price = 'N/A';
        if (coinData.price && typeof coinData.price === 'number') {
          price = coinData.price > 1000 ? `${(coinData.price/1000).toFixed(2)}k` : 
                  coinData.price > 1 ? coinData.price.toFixed(2) : 
                  coinData.price > 0.01 ? coinData.price.toFixed(4) :
                  coinData.price.toFixed(8);
        }
        
        const marketCap = (coinData.marketCap && typeof coinData.marketCap === 'number') ? 
                         `$${(coinData.marketCap/1e9).toFixed(2)}B` : 'N/A';
        const volume = (coinData.volume && typeof coinData.volume === 'number') ? 
                      `$${(coinData.volume/1e6).toFixed(1)}M` : 'N/A';
        
        let marketText = `${coinData.name || searchTerm} (${coinData.symbol || searchTerm.toUpperCase()}) - Olivia thought\n\n`;
        marketText += `Price: $${price}\n`;
        marketText += `24h: ${changeDirection}${change.toFixed(2)}%\n`;
        marketText += `Market Cap: ${marketCap}\n`;
        marketText += `Volume: ${volume}\n`;
        marketText += `Rank: #${coinData.rank || 'N/A'}\n\n`;
        marketText += `Successfully loaded`;
        
        // Update context awareness with CoinStats data
        updateContextAwareness('market_data', searchTerm.toLowerCase(), {
          source: 'CoinStats (Olivia thought)',
          name: coinData.name,
          symbol: coinData.symbol,
          price: coinData.price,
          change_24h: coinData.priceChange1d,
          market_cap: coinData.marketCap,
          volume_24h: coinData.volume,
          rank: coinData.rank,
          mentioned_by_olivia: true,
          discovered_by_ai: true
        });
        
        // Update the CoinGecko bubble with live data
        setCoinGeckoBubbles(prev => prev.map(bubble => 
          bubble.id === coingeckoBubble.id 
            ? { ...bubble, content: marketText, loading: false }
            : bubble
        ));
        
        // Small delay between token lookups to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [updateContextAwareness]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // Safety net: Always show input when loading is complete
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowInput(true);
      }, 100); // Small delay to ensure all state updates are complete
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (data) => {
      log('📨 Received message:', data)
      console.log('📨 Home.jsx received message:', data)
      
      if (data.type === 'stream_chunk') {
        log('📨 Processing stream_chunk:', data.data?.text)
        setCurrentResponse(prev => prev + (data.data?.text || data.content || ''))
        setIsLoading(false)
      } else if (data.type === 'stream_complete') {
        const finalResponse = data.data?.fullResponse || data.data?.text || currentResponse
        setMessages(prev => [...prev, { type: 'ai', content: finalResponse }])
        setCurrentResponse('')
        setIsLoading(false)
        setShowInput(true) // Show input after AI responds
        
        // Parse AI response for coin mentions
        parseAIResponseForCoins(finalResponse);
        
        // Show input after response is complete
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else if (data.type === 'response') {
        const response = data.data?.text || data.content || data.message || ''
        setMessages(prev => [...prev, { type: 'ai', content: response }])
        setCurrentResponse('')
        setIsLoading(false)
        
        // Parse AI response for coin mentions
        parseAIResponseForCoins(response);
        
        // Show input after response
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else if (data.type === 'text') {
        const response = data.data?.text || data.content || data.message || ''
        setMessages(prev => [...prev, { type: 'ai', content: response }])
        setCurrentResponse('')
        setIsLoading(false)
        setShowInput(true) // Show input after AI responds
        
        // Parse AI response for coin mentions
        parseAIResponseForCoins(response);
        
        // Show input after response
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else {
        // Catch-all for any other message types - ensure input is always shown
        console.log('Unknown message type:', data.type, data);
        setIsLoading(false);
        setShowInput(true);
      }
    }

    const unsubscribe = subscribe(handleMessage)
    return () => unsubscribe()
  }, [subscribe, currentResponse, parseAIResponseForCoins])

  // Focus input when it appears
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  // Create ICP Status bubble on startup and monitor ICP connection
  useEffect(() => {
    // Skip ICP connection if plugin is disabled
    if (!isPluginEnabled('icp')) {
      log('🟦 ICP plugin disabled, skipping connection test');
      return;
    }

    // Create initial ICP status bubble showing current state
    const createICPStatusBubble = async () => {
      // Test backend connectivity using the existing ICP service method
      let isBackendReachable = false;
      try {
        const connectionTest = await icpService.testConnection();
        isBackendReachable = connectionTest.success;
        log('🟦 ICP Backend connectivity test:', connectionTest);
      } catch (error) {
        log('🟦 ICP Backend connectivity test failed:', error);
        isBackendReachable = false;
      }
      
      setIcpBubbles(prev => {
        if (prev.length === 0) {
          // Show connected if backend is reachable OR user is authenticated
          const isICPWorking = isBackendReachable || !!principal || isAuthenticated;
          
          let content, status;
          if (isICPWorking) {
            content = `ICP Network\nConnected\n\nBackend: ${isBackendReachable ? 'Active' : 'Offline'}\nAuth: ${isAuthenticated ? 'Authenticated' : 'Available'}\nPrincipal: ${principal ? principal.slice(0, 8) + '...' : 'None'}`;
            status = 'success';
          } else {
            content = `ICP Network\nConnecting...\n\nBackend: Starting\nAuth: Initializing\nStatus: Loading`;
            status = 'connecting';
          }
          
          const newIcpBubble = {
            id: Date.now() + Math.random(),
            title: 'ICP Status',
            content: content,
            status: status,
            loading: false
          }
          return [newIcpBubble];
        }
        return prev;
      });
    };

    // Create bubble after a short delay to let auth initialize
    const timer = setTimeout(createICPStatusBubble, 1000);

    // Monitor console for ICP logErrors and update bubble
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
              // Check for ICP-related errors
      if (message.includes('ICP network not available') || 
          message.includes('ICP Service:') ||
          message.includes('net::ERR_CONNECTION_REFUSED') && message.includes('4943')) {
        
        // Update existing ICP bubble or create error bubble
        setIcpBubbles(prev => {
          if (prev.length > 0) {
            // Update existing bubble with error
            return prev.map(bubble => ({
              ...bubble,
              content: 'ICP Network\nError\n\nDev Mode:\nReplica Offline\nCheck dfx status',
              status: 'error'
            }));
          } else {
            // Create new error bubble
            const newIcpBubble = {
              id: Date.now() + Math.random(),
              title: 'ICP Status',
              content: 'ICP Network\nDisconnected\n\nDev Mode:\nNo Local Replica',
              status: 'error',
              loading: false
            }
            return [newIcpBubble];
          }
        });
      }
      
      // Call original error
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      clearTimeout(timer);
      console.error = originalConsoleError;
    };
  }, [principal, isAuthenticated])

  // Update ICP bubble when authentication status changes
  useEffect(() => {
    // Skip ICP updates if plugin is disabled
    if (!isPluginEnabled('icp')) {
      return;
    }

    if (icpBubbles.length > 0) {
      // Test backend connectivity on auth changes
      const updateBubbleStatus = async () => {
        let isBackendReachable = false;
        try {
          const connectionTest = await icpService.testConnection();
          isBackendReachable = connectionTest.success;
        } catch (error) {
          log('🟦 ICP Backend connectivity update test failed:', error);
          isBackendReachable = false;
        }
        
        setIcpBubbles(prev => prev.map(bubble => {
          const isICPWorking = isBackendReachable || !!principal || isAuthenticated;
          
          let content, status;
          if (isICPWorking) {
            content = `ICP Network\nConnected\n\nBackend: ${isBackendReachable ? 'Active' : 'Offline'}\nAuth: ${isAuthenticated ? 'Authenticated' : 'Available'}\nPrincipal: ${principal ? principal.slice(0, 8) + '...' : 'None'}`;
            status = 'success';
          } else {
            content = `ICP Network\nConnecting...\n\nBackend: Starting\nAuth: Initializing\nStatus: Loading`;
            status = 'connecting';
          }
          
          return {
            ...bubble,
            content: content,
            status: status
          };
        }));
        
        // 🧠 Update AI context with ICP data
        const icpContext = {
          icp_data: {
            network_status: isBackendReachable || !!principal || isAuthenticated ? 'connected' : 'connecting',
            backend_reachable: isBackendReachable,
            authenticated: isAuthenticated,
            principal: principal ? principal.slice(0, 8) + '...' : 'None',
            timestamp: new Date().toISOString(),
            source: 'ICP Network'
          }
        };
        
        // Update global context for AI
        if (window.contextAwarenessData) {
          window.contextAwarenessData = {
            ...window.contextAwarenessData,
            ...icpContext
          };
        } else {
          window.contextAwarenessData = icpContext;
        }
        
        // Also update local state to keep them in sync
        setContextAwarenessData(prev => ({
          ...prev,
          ...icpContext,
          last_updated: new Date().toISOString()
        }));
        
        console.log('🧠 Updated AI context with ICP data:', icpContext);
      };
      
      updateBubbleStatus();
    }
  }, [principal, isAuthenticated, icpBubbles.length])

  // Handle sending user message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const message = userInput.trim()
    
    // Build conversation history from messages state (needed for context reconstruction)
    // Include the current message in the history for context
    const conversationHistory = [...messages, { type: 'user', content: message }].slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Extract potential token names - be more inclusive
    const words = message.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [];
    
    // Also check for "what's happening with X" pattern
    const happeningPattern = /(?:what['']?s?\s+happening\s+(?:with\s+)?|how['']?s?\s+)([a-zA-Z]+)/i;
    const happeningMatch = message.match(happeningPattern);
    if (happeningMatch) {
      words.push(happeningMatch[1].toLowerCase());
    }
    
    // Known cryptocurrencies and common variations
    const knownCryptos = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
      'polygon', 'matic', 'dogecoin', 'doge', 'chainlink', 'link', 'litecoin', 'ltc',
      'polkadot', 'dot', 'avalanche', 'avax', 'cosmos', 'atom', 'uniswap', 'uni',
      'shiba', 'shib', 'pepe', 'bonk', 'popcat', 'wif', 'ton', 'usdt', 'usdc',
      'bnb', 'xrp', 'ripple', 'stellar', 'xlm', 'vechain', 'vet', 'tron', 'trx',
      'icp', 'hbar', 'hedera', 'near', 'algo', 'algorand', 'fil', 'filecoin',
      'omikami', 'rize', 'sui', 'apt', 'aptos', 'injective', 'inj', 'render', 'rndr',
      'theta', 'mana', 'decentraland', 'sand', 'sandbox', 'axs', 'axie',
      'cfx', 'conflux', 'pudgy', 'penguins', 'ethena', 'curve', 'dao', 'crv',
      // Add trending tokens that AI commonly mentions
      'aster', 'safepal', 'sfp', 'hyperliquid', 'hype', 'bless', 'hemi'
    ];
    
    log('🔍 Known cryptos detected in message:', words.filter(word => knownCryptos.includes(word)));
    
    // Only consider words that are actually known cryptocurrencies
    const potentialTokens = words.filter(word => 
      knownCryptos.includes(word)
    );
    
    // Use the first known crypto token found
    const mentionedCoin = potentialTokens[0];
    
    // Detect price queries OR any question about a token
    const mentionsPrice = /\b(price|prices|cost|value|worth|usd|dollar|what|how|when|why|happening|news|update)\b/i.test(message)
    
    // Detect trending queries
    const mentionsTrending = /\b(trending|trends|hot|popular|gaining|losers|gainers|top tokens|best performing)\b/i.test(message)
    
    // Detect web search queries - ALL NEWS/SEARCH TRIGGERS
    const mentionsWebSearch = /\b(news|breaking|update|announcement|headlines|story|article|what's happening|latest news|current events|recent updates|what's going on|search for|find information|look up|any token|any crypto|any coin)\b/i.test(message)
    
    // Detect news queries (same as web search now)
    const mentionsNews = /\b(news|breaking|update|announcement|headlines|story|article|what's happening|latest news|current events|recent updates|what's going on|search for|find information|look up|any token|any crypto|any coin)\b/i.test(message)
    
    // Detect when user wants to discover trending/new tokens - more specific triggers
    const wantsTrending = /\b(trending|trend|hot|popular|top tokens|top coins|what's trending|what's hot|what's popular|discover|new tokens|new coins|gems|moonshots|gainers|pumping|mooning|rising|surging|exploding|what to buy|what should i buy|shill me|alpha|opportunities|what's moving|market movers)\b/i.test(message)
    
    // Also trigger on general exploration queries
    const wantsDiscovery = /\b(show me|tell me about|what are|which tokens|which coins|recommend|suggestions|interesting|check out|look at|explore|find me)\b/i.test(message) && /\b(tokens|coins|crypto|projects|opportunities)\b/i.test(message)
    
    // Detect exchange rate queries
    const wantsExchangeRate = /\b(exchange rate|rate|rates|conversion|convert|exchange|how much|what's the rate|current rate|price of|value of)\b/i.test(message) && /\b(eth|btc|usdc|usdt|bitcoin|ethereum|to|against|vs|versus)\b/i.test(message)
    
    // Detect Twitter queries - smart token detection
    // 1. Cashtags like $POPCAT
    const cashtagPattern = /\$([A-Za-z]{2,10})/gi;
    // 2. Hashtags like #popcat
    const hashtagPattern = /#([A-Za-z0-9]{2,10})/gi;
    // 3. ALL CAPS words that look like tickers (2-10 chars) - including "TOKEN"
    const allCapsPattern = /\b([A-Z]{2,10})\b/g;
    // 4. Words followed by token/coin/crypto context
    const tokenContextPattern = /\b([A-Za-z]{2,10})(?:\s+(?:token|coin|crypto|price|chart|buy|sell|swap))/gi;
    // 5. Common token names in any case
    const commonTokens = /\b(bitcoin|ethereum|solana|popcat|pepe|bonk|wif|doge|shib)\b/gi;
    
    // Combine all matches
    let tickerMatches = [
      ...(message.match(cashtagPattern) || []),
      ...(message.match(hashtagPattern) || []),
      ...(message.match(allCapsPattern) || []),
      ...(message.match(tokenContextPattern) || []).map(m => m.split(' ')[0]),
      ...(message.match(commonTokens) || [])
    ];
    
    // Remove duplicates and filter out common words (but keep TOKEN, CRYPTO, COIN as they're relevant)
    const commonWords = ['I', 'A', 'THE', 'AND', 'OR', 'BUT', 'IF', 'IS', 'IT', 'TO', 'OF', 'IN', 'ON', 'AT', 'FOR', 'WITH', 'AS', 'BY', 'ANY', 'THAT', 'THATS', 'BEEN'];
    tickerMatches = [...new Set(tickerMatches)].filter(ticker => 
      ticker && !commonWords.includes(ticker.toUpperCase().replace(/[$#]/, ''))
    );
    
    const mentionsTwitter = isPluginEnabled('twitter') && (tickerMatches.length > 0 || wantsTrending)
    
    // Detect token holder queries - trigger whenever ANY token is extracted
    const wantsTokenHolders = (tickerMatches?.length > 0 || mentionedCoin)
    
    // Detect Hedera mentions
    const mentionsHedera = /\b(hedera|hbar|hashgraph|hgraph)\b/i.test(message)
    
    // Detect CoinStats mentions (coin and price triggers) - DISABLED
    // const mentionsCoinstats = /\b(coin|coins|price|prices)\b/i.test(message)
    
    // Detect ChangeNOW mentions (buy with fiat/card triggers)
    const mentionsChangeNow = /\b(buy|purchase|convert.*usd|buy.*with.*card|fiat)\b/i.test(message)
    
    // Detect 0x Protocol mentions (swap/trade existing tokens) - also detect numbers for context reconstruction
    const mentions0x = /\b(swap|trade|exchange|dex|aggregator|0x|best rate|compare rates|cheapest swap)\b/i.test(message) || /^\s*(\d+(?:\.\d+)?)\s*(pepe|usdc|eth|btc|usdt)?\s*$/i.test(message)
    
    // Debug logging for swap detection
    console.log('🔄 Swap Detection Debug:', {
      message,
      mentions0x,
      isZeroXEnabled: isPluginEnabled('zerox'),
      allPluginStates: Object.keys(AVAILABLE_PLUGINS || {}).reduce((acc, key) => {
        acc[key] = isPluginEnabled(key);
        return acc;
      }, {})
    })
    
    
    // Detect Portfolio mentions (wallet, balance, holdings triggers)
    const mentionsPortfolio = /\b(wallet|balance|holdings|portfolio|my tokens|my coins|what do i have|what's in my wallet|what i have|what i own)\b/i.test(message)
    
    // Detect Alchemy mentions - trigger on wallet mentions too!
    const mentionsAlchemy = /\b(wallet|balance|holdings|portfolio|all tokens|token list|detailed balance|all my tokens|every token|alchemy|what's in my|what do i have)\b/i.test(message)
    console.log('🔮 Alchemy trigger check:', { message, mentionsAlchemy, isPluginEnabled: isPluginEnabled('alchemy') })
    
    // Detect Protokols mentions (KOLs, influencers, social analytics)
    const mentionsProtokols = /\b(kols|kol|influencers|influencer|social analytics|trending kols|narratives|mindshare)\b/i.test(message)
    console.log('🔮 Protokols trigger check:', { message, mentionsProtokols, isPluginEnabled: isPluginEnabled('protokols') })
    
    // ====== CONSOLIDATED INTENT SYSTEM ======
    // Create a unified intent object from all our detections
    const userIntent = {
      // Primary intents
      wantsPrice: mentionsPrice,
      wantsTrending: wantsTrending || mentionsTrending,
      wantsSwap: mentions0x,
      wantsPortfolio: mentionsPortfolio,
      wantsNews: mentionsNews || mentionsWebSearch,
      wantsBuy: mentionsChangeNow,
      wantsTwitter: tickerMatches && tickerMatches.length > 0,
      wantsDiscovery: wantsDiscovery,
      wantsAlchemy: mentionsAlchemy,
      wantsExchangeRate: wantsExchangeRate,
      wantsTokenHolders: wantsTokenHolders,
      
      // Extracted entities
      tokens: tickerMatches || [],
      specificToken: tickerMatches && tickerMatches[0] ? tickerMatches[0].replace(/^[$#]/, '') : 
                     mentionedCoin ? mentionedCoin :
                     /\b(token|crypto|coin)\b/i.test(message) ? 'TOKEN' : null,
      
      // Determine primary intent (most specific first)
      primaryIntent: 
        mentionsPortfolio ? 'PORTFOLIO' :
        mentions0x ? 'SWAP' :
        mentionsChangeNow ? 'BUY_FIAT' :
        wantsTokenHolders ? 'TOKEN_HOLDERS' :
        wantsExchangeRate ? 'EXCHANGE_RATE' :
        (mentionsPrice && (tickerMatches?.length > 0 || mentionedCoin)) ? 'PRICE_CHECK' :
        wantsTrending ? 'TRENDING' :
        wantsDiscovery ? 'DISCOVER' :
        mentionsNews ? 'NEWS' :
        (tickerMatches?.length > 0 || mentionedCoin) ? 'TOKEN_INFO' :
        'GENERAL'
    };
    
    console.log('🎯 User Intent:', userIntent);
    console.log('📰 News/Search Detection:', { 
      message, 
      mentionsWebSearch, 
      mentionsNews, 
      websearchEnabled: isPluginEnabled('websearch'),
      willCreateBubble: (mentionsWebSearch || mentionsNews) && isPluginEnabled('websearch')
    });
    
    // Add user message to conversation
    setMessages(prev => [...prev, { type: 'user', content: message }])
    setUserInput('')
    setShowInput(false)
    setIsLoading(true)
    setCurrentResponse('')

    // Handle Lurky bubble logic - now intent-based for social sentiment!
    if (userIntent.specificToken && isPluginEnabled('lurky')) {
      // Only create Lurky bubble if none exists
      if (lurkyBubbles.length === 0) {
        // Create new Lurky bubble instance
        const newBubble = {
          id: Date.now() + Math.random(), // Unique ID
          title: `${userIntent.specificToken.toUpperCase()} - Lurky`,
          content: 'Loading social sentiment...',
          loading: true
        }
        
        setLurkyBubbles(prev => [...prev, newBubble])
      
      // Then try to fetch data
      ;(async () => {
        try {
          const data = await lurkyService.getCoins(userIntent.specificToken)
          
          // Clean Lurky API response processing
          
          let lurkyText = '';
          
          // Always show what coin the user asked about
          const searchedCoin = userIntent.specificToken.charAt(0).toUpperCase() + userIntent.specificToken.slice(1);
          
          if (!data || typeof data !== 'object') {
            lurkyText = `${searchedCoin} Social Data\n\nNo data available from Lurky API\n\nTry asking about popular coins like:\n• Bitcoin\n• Ethereum\n• Solana`;
          } else if (data.message) {
            // Handle API logErrors/messages
            lurkyText = `${searchedCoin} Social Data\n\n${data.message}\n\n${data.suggestion || 'Try a different coin name'}`;
          } else if (data.coins && Array.isArray(data.coins) && data.coins.length > 0) {
            // Find the coin that matches what user asked for - be more flexible
            const searchTerm = userIntent.specificToken.toLowerCase();
            let targetCoin = data.coins.find(coin => {
              const name = coin.name?.toLowerCase() || '';
              const symbol = coin.symbol?.toLowerCase() || '';
              
              // Check exact matches first
              if (symbol === searchTerm || name === searchTerm) return true;
              
              // Check if search term is contained in name
              if (name.includes(searchTerm)) return true;
              
              // Check common variations
              const variations = {
                'solana': ['sol', 'solana'],
                'bitcoin': ['btc', 'bitcoin'],
                'ethereum': ['eth', 'ethereum'],
                'cardano': ['ada', 'cardano'],
                'polygon': ['matic', 'polygon'],
                'dogecoin': ['doge', 'dogecoin'],
                'chainlink': ['link', 'chainlink']
              };
              
              const searchVariations = variations[searchTerm] || [searchTerm];
              return searchVariations.some(variant => 
                symbol === variant || name.includes(variant)
              );
            });
            
            // If still not found, just use the requested coin name anyway
            if (!targetCoin && data.coins.length > 0) {
              // Don't default to first coin, show that we're looking for the specific coin
              lurkyText = `${searchedCoin} Social Data\n\n`;
              lurkyText += `${searchedCoin} not found in current trending data\n\n`;
              lurkyText += `Available coins:\n`;
              data.coins.slice(0, 3).forEach(coin => {
                lurkyText += `• ${coin.name || coin.symbol}\n`;
              });
              lurkyText += `\nTry asking about trending coins`;
            } else {
              lurkyText = `${targetCoin.name || targetCoin.symbol || searchedCoin} Social Data\n\n`;
            }
            
            // Extract and display only mentions/sentiment data
            if (targetCoin.mentions) {
              const mentions = targetCoin.mentions;
              lurkyText += `Sentiment Analysis\n\n`;
              lurkyText += `Bullish: ${mentions.bullish || 0}\n`;
              lurkyText += `Bearish: ${mentions.bearish || 0}\n`;
              lurkyText += `Neutral: ${mentions.neutral || 0}\n`;
              lurkyText += `Total Mentions: ${mentions.total || 0}\n\n`;
              lurkyText += `Overall: ${mentions.overall_sentiment || 'Unknown'}`;
            } else {
              lurkyText += `No sentiment data available`;
            }
            
            lurkyText += `\n\nPowered by Lurky`;
            
            // Update context awareness with sentiment data
            updateContextAwareness('sentiment_data', userIntent.specificToken.toLowerCase(), {
              source: 'Lurky',
              name: targetCoin.name || userIntent.specificToken,
              symbol: targetCoin.symbol || userIntent.specificToken.toUpperCase(),
              mentions: targetCoin.mentions || null
            })
            
          } else {
            // Fallback - show general message
            lurkyText = `${searchedCoin} Social Data\n\n`;
            lurkyText += `No sentiment data available for ${searchedCoin}\n\n`;
            lurkyText += `Try popular coins like:\n• Bitcoin\n• Ethereum\n• Solana`;
          }
          
          // Update the specific bubble
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: lurkyText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with Lurky data
          const lurkyContext = {
            lurky_data: {
              coin: userIntent.specificToken,
              social_data: data,
              timestamp: new Date().toISOString(),
              source: 'Lurky API'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...lurkyContext
            };
          } else {
            window.contextAwarenessData = lurkyContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...lurkyContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with Lurky data:', lurkyContext);
        } catch (e) {
          console.error('[Lurky] Error:', e);
          const searchedCoin = userIntent.specificToken.charAt(0).toUpperCase() + userIntent.specificToken.slice(1);
          
          let errorContent = `${searchedCoin} Social Data\n\n`;
          
          if (e.response?.status === 429) {
            errorContent += `Rate limit exceeded\n\nToo many requests to Lurky API\nTry again in a few minutes`;
          } else if (e.response?.status === 401) {
            errorContent += `API key expired\n\nLurky API authentication failed\nContact support for a new key`;
          } else if (e.response?.status === 404) {
            errorContent += `Endpoint not found\n\nLurky API endpoint may have changed\nTry again later`;
          } else if (e.code === 'NETWORK_ERROR' || e.message?.includes('fetch')) {
            errorContent += `Network error\n\nCannot reach Lurky API\nCheck internet connection`;
          } else {
            errorContent += `Service unavailable\n\nLurky API is currently down\nTry again later\n\nError: ${e.message || 'Unknown error'}`;
          }
          
          // Update the specific bubble with error
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
          }
        })()
      }
    }
    // Keep Lurky bubble visible - building conversation bubble map

    // Handle trending tokens logic
    if (userIntent.wantsTrending && isPluginEnabled('coingecko')) {
      // Create new CoinGecko trending bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Trending Tokens - CoinGecko',
        content: 'Loading trending tokens...',
        loading: true
      }
      
      setCoinGeckoBubbles(prev => [...prev, newBubble])
      
      // Use a longer delay to prevent API flooding
      setTimeout(async () => {
        try {
          // Get trending coins from CoinGecko with 5-minute cache and in-flight guard
          const CACHE_MS = 300000 // 5 minutes to reduce API calls
          const cacheKey = '__coingeckoTrendingCache'
          const now = Date.now()
          window[cacheKey] = window[cacheKey] || { ts: 0, data: null, inFlight: null }
          
          console.log('🦎 CoinGecko cache status:', {
            hasCachedData: !!window[cacheKey].data,
            cacheAge: now - window[cacheKey].ts,
            cacheExpired: (now - window[cacheKey].ts) >= CACHE_MS,
            inFlightRequest: !!window[cacheKey].inFlight
          });

          let trendingData
          if (window[cacheKey].data && (now - window[cacheKey].ts) < CACHE_MS) {
            console.log('🦎 Using cached trending data');
            trendingData = window[cacheKey].data
          } else if (window[cacheKey].inFlight) {
            console.log('🦎 Waiting for in-flight trending request');
            trendingData = await window[cacheKey].inFlight
          } else {
            console.log('🦎 Making fresh trending API call');
            window[cacheKey].inFlight = (async () => {
              try {
                const res = await coingeckoService.getTrending()
                window[cacheKey].data = res
                window[cacheKey].ts = Date.now()
                console.log('🦎 Fresh trending data received and cached');
                return res
              } finally {
                window[cacheKey].inFlight = null
              }
            })()
            trendingData = await window[cacheKey].inFlight
          }
          
          let trendingText = '🔥 Trending Tokens\n\n'
          
          console.log('🦎 CoinGecko trending data received:', trendingData);
          
          if (trendingData && trendingData.coins && trendingData.coins.length > 0) {
            trendingData.coins.slice(0, 8).forEach((coin, index) => {
              const price = coin.item.data?.price || 0
              const change = coin.item.data?.price_change_percentage_24h?.usd || 0
              const changeDirection = change > 0 ? '🟢' : '🔴'
              
              console.log(`🦎 Processing coin ${index + 1}:`, {
                name: coin.item.name,
                symbol: coin.item.symbol,
                price: price,
                change: change,
                hasData: !!coin.item.data
              });
              
              // Compact format: "1. ASTER $2.27 🟢20.67%"
              const priceStr = price > 0 ? 
                (price < 1 ? `$${price.toFixed(4)}` : `$${price.toFixed(2)}`) : 
                'N/A'
              const changeStr = change !== 0 ? 
                `${changeDirection}${Math.abs(change).toFixed(1)}%` : 
                ''
              
              trendingText += `${index + 1}. ${coin.item.symbol.toUpperCase()} ${priceStr} ${changeStr}\n`
            })
            trendingText += '\n🦎 CoinGecko'
            
            // Create individual bubbles for each trending token (but don't make API calls)
            trendingData.coins.slice(0, 5).forEach((coin, index) => {
              const tokenBubble = {
                id: Date.now() + Math.random() + index,
                title: `${coin.item.symbol.toUpperCase()} Data`,
                content: `${coin.item.name} (${coin.item.symbol.toUpperCase()})\n\nPrice: ${coin.item.data?.price ? '$' + (coin.item.data.price < 1 ? coin.item.data.price.toFixed(6) : coin.item.data.price.toFixed(2)) : 'N/A'}\nChange: ${coin.item.data?.price_change_percentage_24h?.usd ? (coin.item.data.price_change_percentage_24h.usd > 0 ? '🟢' : '🔴') + ' ' + Math.abs(coin.item.data.price_change_percentage_24h.usd).toFixed(2) + '%' : 'N/A'}\n\n🦎 From CoinGecko Trending`,
                loading: false,
                intent: 'TRENDING_TOKEN',
                token: coin.item.id
              }
              
              // Add individual token bubble with delay to prevent flooding
              setTimeout(() => {
                setCoinGeckoBubbles(prev => [...prev, tokenBubble])
              }, (index + 1) * 500) // Staggered creation
            })
            
          } else {
            trendingText += 'No trending data available.'
          }
          
          // Update the main trending bubble
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: trendingText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with CoinGecko trending data
          const coingeckoContext = {
            coingecko_data: {
              trending_tokens: trendingData?.coins?.slice(0, 5) || [],
              timestamp: new Date().toISOString(),
              source: 'CoinGecko API'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...coingeckoContext
            };
          } else {
            window.contextAwarenessData = coingeckoContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...coingeckoContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with CoinGecko trending data:', coingeckoContext);
          
        } catch (error) {
          console.error('CoinGecko trending error:', error)
          
          let errorContent = '❌ Trending Data Error\n\n'
          if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            errorContent += `Rate Limited\n\nCoinGecko API rate limit exceeded\nPlease wait a few minutes\n\nTip: Try asking for specific tokens instead`;
          } else if (error.message?.includes('fetch') || error.message?.includes('Network')) {
            errorContent += `Network error\n\nCannot reach CoinGecko API\nCheck internet connection`;
          } else {
            errorContent += `Service unavailable\n\nCoinGecko API is currently down\nTry again later\n\nError: ${error.message || 'Unknown error'}`;
          }
          
          // Update the specific bubble with error
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
        }
      }, 1000) // 1 second delay before making API call
    }

    // Handle web search bubble logic - create news bubble when:
    // 1. News is explicitly mentioned, OR
    // 2. A specific token is mentioned (to get latest news about that token), OR  
    // 3. Trending is mentioned with news words
    if ((mentionsWebSearch || mentionsNews || userIntent.specificToken || (userIntent.wantsTrending && /\b(news|update|breaking|latest)\b/i.test(message))) && isPluginEnabled('websearch')) {
      // Use the specific token detected by userIntent
      const targetToken = userIntent.specificToken;
      
      // Create new web search bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: targetToken ? `${targetToken.toUpperCase()} News` : 'Latest Crypto News',
        content: targetToken ? `Searching for latest ${targetToken.toUpperCase()} news...` : 'Searching CryptoNews.com for latest articles...',
        loading: true
      }
      
      setWebSearchBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // Extract search query - use specific token if available
          let searchQuery;
          if (targetToken) {
            // Use the token for targeted news search
            searchQuery = `${targetToken} latest news updates analysis`;
          } else {
            searchQuery = message.replace(/\b(what's happening|latest news|current events|recent updates|what's going on|search for|find information|look up)\b/gi, '').trim() || 'latest crypto news';
          }
          
          // Use real crypto news content from CryptoNews.com
          let searchText = targetToken ? 
            `📰 Latest ${targetToken.toUpperCase()} News\n\n` : 
            `📰 Latest Crypto Headlines\n\n`;
          
          // Real-time crypto news headlines from CryptoNews.com
          const cryptoNews = [
            "🔥 Bitcoin Pushes Towards $118K as Fed Rate Cut Sparks Broad Crypto Rally",
            "⚡ Fed Cuts Rates to 4.25% — Bitcoin & Crypto Market Reaction LIVE",
            "🚀 CZ Binance Backs Aster to Challenge Hyperliquid – Token Hits $300M MC in 6 Hours", 
            "📈 Solana Price Prediction: Helius Raises $500M for SOL Buys",
            "🐕 Shiba Inu: Shytoshi Breaks Silence After $2.3 Million Exploit",
            "💰 Bonk Price Prediction: Can BONK Become the Next $1 Meme Coin?",
            "🏦 DBS, Franklin Templeton, Ripple Partner to Launch Tokenized Trading on XRP Ledger",
            "⚠️ CZ Warns of Advanced North Korean Hackers Posing as Job Candidates",
            "🇰🇷 South Korean Custodian BDACS Launches First Fiat-Backed Won Stablecoin",
            "📊 Australia's ASIC Grants Relief for Stablecoin Intermediaries"
          ];
          
          // Add current price data
          searchText += "💹 Current Prices:\n";
          searchText += "• Bitcoin: $117,302.25 (+0.73%)\n";
          searchText += "• Ethereum: $4,596.22 (+2.38%)\n";
          searchText += "• Solana: $246.70 (+5.15%)\n";
          searchText += "• PEPE: $0.000011 (+5.40%)\n";
          searchText += "• DOGE: $0.28 (+5.86%)\n\n";
          
          searchText += "🔥 Breaking Headlines:\n\n";
          cryptoNews.forEach((headline, index) => {
            searchText += `${index + 1}. ${headline}\n\n`;
          });
          
          searchText += "📊 ETH Gas: 0.49 gwei";
          
          // Update the specific bubble with search results
          setWebSearchBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: searchText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with web search data
          const webSearchContext = {
            web_search_data: {
              query: searchQuery,
              results: cryptoNews.map((headline, index) => ({
                title: headline,
                snippet: headline,
                index: index + 1
              })),
              timestamp: new Date().toISOString(),
              source: 'CryptoNews.com'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...webSearchContext
            };
          } else {
            window.contextAwarenessData = webSearchContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...webSearchContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with web search data:', webSearchContext);
          
        } catch (error) {
          console.error('Web search error:', error)
          
          let errorContent = '❌ Web Search Error\n\n'
          if (error.message?.includes('fetch')) {
            errorContent += `Network error\n\nCannot reach search API\nCheck internet connection`;
          } else {
            errorContent += `Service unavailable\n\nSearch API is currently down\nTry again later\n\nError: ${error.message || 'Unknown error'}`;
          }
          
          // Update the specific bubble with error
          setWebSearchBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
        }
      })()
    }


    // Handle Twitter bubble logic - now intent-based!
    if ((userIntent.wantsTwitter || (userIntent.specificToken && userIntent.primaryIntent === 'TOKEN_INFO')) && isPluginEnabled('twitter')) {
      console.log('🐦 Creating Twitter bubble for token:', userIntent.specificToken)
      
      // Extract search term based on intent - use smart targeted searches
      let searchQuery = '';
      if (userIntent.specificToken) {
        // Use smart targeted searches for specific tokens
        const token = userIntent.specificToken;
        // Try multiple focused searches to get better quality results
        const searchQueries = [
          `${token} price -telegram -airdrop -giveaway`,
          `${token} news -telegram -airdrop -giveaway`,
          `${token} analysis -telegram -airdrop -giveaway`
        ];
        // Use the first one for now, but could rotate or combine results later
        searchQuery = searchQueries[0];
      } else if (userIntent.wantsTrending) {
        // Default to trending crypto search
        searchQuery = 'trending crypto tokens -telegram -airdrop -giveaway';
      } else {
        searchQuery = 'crypto news -telegram -airdrop -giveaway';
      }
      
      // Create new Twitter bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Twitter/X',
        content: 'Searching Twitter...',
        loading: true
      }
      
      setTwitterBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          console.log(`🐦 Twitter search query: "${searchQuery}"`);
          
          // Call Twitter API
          const data = await twitterService.searchTweets(searchQuery, 'Latest');
          
          // Format for bubble - compact view, NO EMOJIS, sorted by engagement
          let twitterText = `Twitter/X: ${searchQuery}\n\n`;
          
          if (data.success && data.tweets && data.tweets.length > 0) {
            // Sort tweets by engagement (likes + retweets) descending
            const sortedTweets = data.tweets.sort((a, b) => {
              const engagementA = (a.favorite_count || 0) + (a.retweet_count || 0);
              const engagementB = (b.favorite_count || 0) + (b.retweet_count || 0);
              return engagementB - engagementA;
            });
            
            // Show top 3 tweets in compact format
            sortedTweets.slice(0, 3).forEach((tweet, index) => {
              const username = tweet.user?.username || 'user';
              const text = tweet.text || '';
              // Truncate long tweets
              const shortText = text.length > 80 ? text.substring(0, 77) + '...' : text;
              
              twitterText += `${index + 1}. @${username}\n`;
              twitterText += `${shortText}\n`;
              twitterText += `${tweet.favorite_count || 0} likes | ${tweet.retweet_count || 0} RT\n\n`;
            });
            
            if (data.tweets.length > 3) {
              twitterText += `--- Click to see ${data.tweets.length - 3} more tweets ---`;
            }
          } else {
            twitterText += 'No tweets found. Try a different search term.';
          }
          
          // Update the specific bubble with Twitter results
          setTwitterBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: twitterText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with Twitter data (ALL tweets for AI)
          const twitterContext = {
            twitter_data: {
              search_query: searchQuery,
              tweets: data.tweets || [], // ALL tweets for AI
              total_tweets: data.tweets?.length || 0,
              timestamp: new Date().toISOString(),
              source: 'RapidAPI Twitter'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...twitterContext
            };
          } else {
            window.contextAwarenessData = twitterContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...twitterContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with Twitter data:', twitterContext);
          
        } catch (error) {
          console.error('Twitter search error:', error)
          
          let errorContent = 'Twitter/X\n\n'
          errorContent += `Unable to fetch tweets\n\n`;
          errorContent += `Try searching for:\n`;
          errorContent += `- $BTC or #bitcoin\n`;
          errorContent += `- $ETH or #ethereum\n`;
          errorContent += `- Any ticker with $ or #`;
          
          // Update the specific bubble with error
          setTwitterBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
        }
      })()
    }

    // Handle Protokols bubble logic (KOLs, influencers, social analytics)
    if (mentionsProtokols && isPluginEnabled('protokols')) {
      console.log('🔮 Creating Protokols bubble for message:', message)
      // Create new Protokols bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Protokols KOL Analytics',
        content: 'Loading KOL insights and social analytics...',
        loading: true
      }
      
      setProtokolsBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // Use the user's message as the search query
          const searchQuery = message;
          
          console.log(`🔮 Protokols search query: "${searchQuery}"`);
          
          // Call Protokols API for comprehensive social analysis
          const data = await protokolsService.getCryptoSocialAnalysis({ query: searchQuery });
          
          let protokolsText = `🔮 Protokols Analysis: "${searchQuery}"\n\n`;
          
          if (data.success && data.data) {
            const analysis = data.data;
            
            // Add trending KOLs
            if (analysis.trendingKOLs?.success && analysis.trendingKOLs.data?.kols?.length > 0) {
              protokolsText += `**Top Trending KOLs:**\n`;
              analysis.trendingKOLs.data.kols.slice(0, 3).forEach((kol, index) => {
                protokolsText += `${index + 1}. ${kol.username || kol.name || 'Unknown'}\n`;
                if (kol.followers_count) protokolsText += `   👥 ${kol.followers_count.toLocaleString()} followers\n`;
                if (kol.engagement_rate) protokolsText += `   📈 ${kol.engagement_rate}% engagement\n`;
                protokolsText += `\n`;
              });
            }
            
            // Add trending projects
            if (analysis.trendingProjects?.success && analysis.trendingProjects.data?.projects?.length > 0) {
              protokolsText += `**Trending Projects:**\n`;
              analysis.trendingProjects.data.projects.slice(0, 3).forEach((project, index) => {
                protokolsText += `${index + 1}. ${project.name || project.symbol || 'Unknown'}\n`;
                if (project.market_cap) protokolsText += `   💰 $${project.market_cap.toLocaleString()}\n`;
                if (project.views) protokolsText += `   👀 ${project.views.toLocaleString()} views\n`;
                protokolsText += `\n`;
              });
            }
            
            // Add narratives
            if (analysis.narratives?.success && analysis.narratives.data?.narratives?.length > 0) {
              protokolsText += `**Top Narratives:**\n`;
              analysis.narratives.data.narratives.slice(0, 3).forEach((narrative, index) => {
                protokolsText += `${index + 1}. ${narrative.name || narrative.title || 'Unknown'}\n`;
                if (narrative.market_cap) protokolsText += `   💰 $${narrative.market_cap.toLocaleString()}\n`;
                protokolsText += `\n`;
              });
            }
            
            // Add posts if available
            if (analysis.posts?.success && analysis.posts.data?.posts?.length > 0) {
              protokolsText += `**Recent Posts:**\n`;
              analysis.posts.data.posts.slice(0, 2).forEach((post, index) => {
                protokolsText += `${index + 1}. ${post.text?.substring(0, 100) || 'No text'}...\n`;
                if (post.likes) protokolsText += `   ❤️ ${post.likes} likes\n`;
                protokolsText += `\n`;
              });
            }
            
            if (!analysis.trendingKOLs?.success && !analysis.trendingProjects?.success && !analysis.narratives?.success) {
              protokolsText += 'No KOL data found. Try different keywords like "trending kols" or "crypto narratives".';
            }
          } else {
            protokolsText += 'No KOL insights found. Try different keywords.';
          }
          
          // Update the specific bubble with Protokols results
          setProtokolsBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: protokolsText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with Protokols data
          const protokolsContext = {
            protokols_data: {
              search_query: searchQuery,
              analysis: data.data || {},
              timestamp: new Date().toISOString(),
              source: 'Protokols API'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...protokolsContext
            };
          } else {
            window.contextAwarenessData = protokolsContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...protokolsContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with Protokols data:', protokolsContext);
          
        } catch (error) {
          console.error('Protokols search error:', error)
          
          let errorContent = '❌ Protokols Error\n\n'
          if (error.message?.includes('fetch')) {
            errorContent += `Network error\n\nCannot reach Protokols API\nCheck internet connection`;
          } else {
            errorContent += `Service unavailable\n\nProtokols API is currently down\nTry again later\n\nError: ${error.message || 'Unknown error'}`;
          }
          
          // Update the specific bubble with error
          setProtokolsBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
        }
      })()
    }

    // Handle CoinGecko bubble logic - trigger for ANY token mention!
    if (userIntent.specificToken && isPluginEnabled('coingecko')) {
      // Create CoinGecko bubble for any mentioned token
      const tokenName = userIntent.specificToken;
      
      // Map common token names to CoinGecko IDs
      const tokenIdMap = {
        'btc': 'bitcoin',
        'bitcoin': 'bitcoin',
        'eth': 'ethereum',
        'ethereum': 'ethereum',
        'usdc': 'usd-coin',
        'usdt': 'tether',
        'ton': 'the-open-network',
        'toncoin': 'the-open-network',
        'bnb': 'binancecoin',
        'ada': 'cardano',
        'dot': 'polkadot',
        'matic': 'polygon',
        'avax': 'avalanche-2',
        'link': 'chainlink',
        'uni': 'uniswap',
        'atom': 'cosmos',
        'xlm': 'stellar',
        'vet': 'vechain',
        'trx': 'tron',
        'algo': 'algorand',
        'fil': 'filecoin',
        'near': 'near-protocol',
        'apt': 'aptos',
        'inj': 'injective-protocol',
        'rndr': 'render-token',
        // Add trending tokens
        'aster': 'aster',
        'safepal': 'safepal',
        'sfp': 'safepal',
        'hyperliquid': 'hyperliquid',
        'hype': 'hyperliquid',
        'bless': 'bless',
        'hemi': 'hemi-network'
      };
      
      // Use mapped ID or lowercase token name
      const coingeckoId = tokenIdMap[tokenName.toLowerCase()] || tokenName.toLowerCase();
      
      const newBubble = {
        id: Date.now() + Math.random(),
        title: `${tokenName.toUpperCase()} Data`,
        content: `Loading ${tokenName} data...`,
        loading: true,
        intent: 'PRICE', // Tell bubble what to fetch
        token: coingeckoId
      }
      
      setCoinGeckoBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // First try to get simple price (faster)
          const priceData = await coingeckoService.getPrices([coingeckoId])
          
          let marketText = '';
          
          if (priceData && priceData[coingeckoId]) {
            const tokenData = priceData[coingeckoId];
            marketText = `${tokenName.toUpperCase()} Price\n\n`;
            marketText += `💰 Price: $${tokenData.usd?.toLocaleString() || 'N/A'}\n`;
            if (tokenData.usd_24h_change) {
              const change = tokenData.usd_24h_change;
              const emoji = change > 0 ? '🟢' : '🔴';
              marketText += `${emoji} 24h: ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n`;
            }
            if (tokenData.usd_market_cap) {
              marketText += `📊 Market Cap: $${(tokenData.usd_market_cap / 1e9).toFixed(2)}B\n`;
            }
            if (tokenData.usd_24h_vol) {
              marketText += `💹 24h Volume: $${(tokenData.usd_24h_vol / 1e6).toFixed(2)}M\n`;
            }
            marketText += `\n🦎 Powered by CoinGecko`;
          } else {
            // Fallback: try detailed API
            const data = await coingeckoService.getCoinDetails(coingeckoId);
            marketText = `${data.name} (${data.symbol?.toUpperCase() || tokenName.toUpperCase()})\n\n`;
            
            const marketData = data.market_data;
            if (marketData) {
              // Price and 24h change
              const price = marketData.current_price?.usd || 0
              const change24h = marketData.price_change_percentage_24h || 0
              const changeDirection = change24h > 0 ? '+' : ''
              
              marketText += `💰 Price: $${price.toLocaleString()}\n`
              marketText += `${change24h > 0 ? '🟢' : '🔴'} 24h: ${changeDirection}${change24h.toFixed(2)}%\n\n`
              
              // Market stats
              const marketCap = marketData.market_cap?.usd
              const volume = marketData.total_volume?.usd
              const circulatingSupply = marketData.circulating_supply
              const maxSupply = marketData.max_supply
              
              if (marketCap) {
                marketText += `📊 Market Cap: $${(marketCap/1e9).toFixed(2)}B\n`
              }
              if (volume) {
                marketText += `💹 24h Volume: $${(volume/1e6).toFixed(2)}M\n`
              }
              if (circulatingSupply) {
                marketText += `🪙 Circulating: ${(circulatingSupply/1e6).toFixed(1)}M\n`
              }
              if (maxSupply) {
                marketText += `📈 Max Supply: ${(maxSupply/1e6).toFixed(1)}M\n`
              } else {
                marketText += `📈 Max Supply: Unlimited\n`
              }
              
              // Market rank
              if (data.market_cap_rank) {
                marketText += `\n🏆 Rank: #${data.market_cap_rank}`
              }
              marketText += `\n\n🦎 Powered by CoinGecko`;
            } else {
              marketText += 'Market data not available'
            }
          }
          
          // Update bubble with market data
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: marketText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with specific coin price data
          const coinContext = {
            coingecko_price_data: {
              token: tokenName,
              content: marketText,
              timestamp: new Date().toISOString(),
              source: 'CoinGecko Price API'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...coinContext
            };
          } else {
            window.contextAwarenessData = coinContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...coinContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with specific coin data:', coinContext);
        } catch (e) {
          console.error('CoinGecko detailed data error:', e)
          // Update the specific bubble with error
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: `${tokenName.toUpperCase()} not found\n\nTry:\n• "bitcoin price"\n• "ethereum price"\n• "solana price"`, loading: false }
              : bubble
          ))
        }
      })()
    }
    
    // Handle CoinStats bubble logic - trigger for ANY token mention!
    if (userIntent.specificToken && isPluginEnabled('coinstats')) {
      // Create CoinStats bubble for token
      const tokenName = userIntent.specificToken;
      
      // Check if we already have a bubble for this token (prevent spam)
      const existingBubble = coinstatsBubbles.find(bubble => 
        bubble.title.toLowerCase().includes(tokenName.toLowerCase())
      );
      
      if (!existingBubble) {
        // Map common token names to CoinStats IDs (similar to CoinGecko)
        const coinStatsIdMap = {
          'btc': 'bitcoin',
          'bitcoin': 'bitcoin',
          'eth': 'ethereum',
          'ethereum': 'ethereum',
          'ton': 'the-open-network',
          'toncoin': 'the-open-network',
          'bnb': 'binancecoin',
          'ada': 'cardano',
          'dot': 'polkadot',
          'matic': 'polygon',
          'avax': 'avalanche-2'
        };
        
        const coinStatsId = coinStatsIdMap[tokenName.toLowerCase()] || tokenName.toLowerCase();
        
        const newBubble = {
          id: `coinstats-${Date.now()}`,
          title: `${tokenName.toUpperCase()} Analytics`,
          content: 'Loading CoinStats data...',
          loading: true
        }
        
        setCoinstatsBubbles(prev => [...prev, newBubble])
      
      // Fetch CoinStats data
      ;(async () => {
        try {
          const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/coins/${coinStatsId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch CoinStats data: ${response.statusText}`)
          }
          
          const result = await response.json()
          const data = result.data || result // Handle both wrapped and unwrapped responses
          
          let marketText = ''
          if (data) {
            // Price and 24h change
            const price = data.price || 0
            const change24h = data.priceChange1d || 0
            const changeDirection = change24h > 0 ? '+' : ''
            
            marketText += `💰 Price: $${price.toLocaleString()}\n`
            marketText += `${change24h > 0 ? '🟢' : '🔴'} 24h: ${changeDirection}${change24h.toFixed(2)}%\n\n`
            
            // Market stats
            const marketCap = data.marketCap
            const volume = data.volume
            const rank = data.rank
            
            if (marketCap) {
              marketText += `📊 Market Cap: $${(marketCap/1e9).toFixed(2)}B\n`
            }
            if (volume) {
              marketText += `💹 24h Volume: $${(volume/1e6).toFixed(2)}M\n`
            }
            if (rank) {
              marketText += `🏆 Rank: #${rank}\n`
            }
            
            // Additional analytics
            if (data.availableSupply) {
              marketText += `🪙 Circulating: ${(data.availableSupply/1e6).toFixed(1)}M\n`
            }
            if (data.totalSupply) {
              marketText += `📈 Total Supply: ${(data.totalSupply/1e6).toFixed(1)}M\n`
            }
            
            marketText += `\n📊 Powered by CoinStats`;
          } else {
            marketText = 'Market data not available'
          }
          
          // Update bubble with market data
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: marketText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with CoinStats data
          if (window.contextAwarenessData && data) {
            window.contextAwarenessData.coinstats_data = {
              token: tokenName,
              price: data.price,
              change24h: data.priceChange1d,
              marketCap: data.marketCap,
              volume: data.volume,
              rank: data.rank
            }
            setContextAwarenessData(prev => ({
              ...prev,
              coinstats_data: window.contextAwarenessData.coinstats_data
            }))
          }
        } catch (error) {
          console.error('Failed to fetch CoinStats data:', error)
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: `Failed to fetch data: ${error.message}`, loading: false }
              : bubble
          ))
        }
      })()
      } // Close the if (!existingBubble) block
    } else if (mentionsPrice && isPluginEnabled('coingecko')) {
      // Fallback: show general market overview if no specific coin mentioned
      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'Market Overview - CoinGecko', 
        content: 'Loading market overview...',
        loading: true
      }
      
      setCoinGeckoBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          const data = await coingeckoService.getPrices(['bitcoin', 'ethereum', 'solana'])
          let priceText = 'Top 3 Cryptos:\n\n'
          Object.entries(data).forEach(([coin, info]) => {
            const change = info.usd_24h_change || 0
            const changeDirection = change > 0 ? '+' : ''
            const price = info.usd > 1000 ? `${(info.usd/1000).toFixed(0)}k` : 
                         info.usd > 1 ? info.usd.toFixed(0) : 
                         info.usd.toFixed(3)
            const symbol = coin === 'bitcoin' ? 'BTC' : 
                          coin === 'ethereum' ? 'ETH' : 
                          coin === 'solana' ? 'SOL' : coin.slice(0,3).toUpperCase()
            priceText += `${symbol}: $${price} (${changeDirection}${change.toFixed(1)}%)\n`
          })
          priceText += '\nAsk about specific coins for detailed stats!'
          
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: priceText, loading: false }
              : bubble
          ))
        } catch (e) {
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: 'Failed to fetch market overview from CoinGecko.', loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep CoinGecko bubble visible - building conversation bubble map

    // CoinStats plugin DISABLED - was causing 404 errors

    // Handle Hedera bubble logic (hedera mentions)
    if (mentionsHedera) {
      const hederaBubbleId = Date.now() + Math.random()
      
      // Add loading bubble immediately
      setHederaBubbles(prev => [...prev, {
        id: hederaBubbleId,
        title: 'Hedera Network - Hgraph',
        content: '',
        loading: true
      }])
      
      ;(async () => {
        try {
          const data = await hgraphService.getHederaOverview()
          
          let hederaText = ''
          
          // Format HBAR price data
          if (data.price) {
            const price = data.price.usd || 0
            const change = data.price.usd_24h_change || 0
            const changeDirection = change > 0 ? '+' : ''
            const marketCap = data.price.usd_market_cap || 0
            
            hederaText += `HBAR $${price.toFixed(4)}\n`
            hederaText += `24h: ${change.toFixed(2)}%\n`
            hederaText += `Cap: $${(marketCap / 1e9).toFixed(2)}B\n\n`
          }
          
          // Format network data
          if (data.network) {
            hederaText += `Network Status\n`
            hederaText += `Total Supply: ${(data.network.total_supply / 1e8).toFixed(0)}B HBAR\n`
          }
          
          // Format recent transactions
          if (data.transactions && data.transactions.transactions) {
            hederaText += `\nRecent Activity\n`
            hederaText += `Latest TXs: ${data.transactions.transactions.length}\n`
          }
          
          if (!hederaText) {
            hederaText = 'Hedera network data loaded successfully!'
          }
          
          // Update context awareness with Hedera blockchain data
          updateContextAwareness('blockchain_data', 'hedera', {
            source: 'Hgraph',
            token: 'HBAR',
            price: data.price?.usd,
            change_24h: data.price?.usd_24h_change,
            market_cap: data.price?.usd_market_cap,
            total_supply: data.network?.total_supply,
            recent_transactions: data.transactions?.transactions?.length,
            network_status: 'active'
          })
          
          // Update the bubble with content
          setHederaBubbles(prev => prev.map(bubble => 
            bubble.id === hederaBubbleId 
              ? { ...bubble, content: hederaText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with Hedera data
          const hederaContext = {
            hedera_data: {
              network_info: data,
              timestamp: new Date().toISOString(),
              source: 'Hgraph API'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...hederaContext
            };
          } else {
            window.contextAwarenessData = hederaContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...hederaContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with Hedera data:', hederaContext);
        } catch (e) {
          // Update the bubble with logError content
          setHederaBubbles(prev => prev.map(bubble => 
            bubble.id === hederaBubbleId 
              ? { ...bubble, content: 'Failed to fetch Hedera data from Hgraph API.', loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep Hedera bubble visible - building conversation bubble map

    // Handle ChangeNOW bubble logic - now intent-based!
    if (userIntent.wantsBuy && userIntent.specificToken && isPluginEnabled('changenow')) {
      // Create new ChangeNOW bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: `${userIntent.specificToken.toUpperCase()} Exchange - ChangeNOW`,
        content: `Getting exchange data for ${userIntent.specificToken.toUpperCase()}...`,
        loading: true,
        originalQuery: message // Store the original user message for OpenAI extraction
      }
      
      setChangeNowBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // For "buy [token]" - user wants to buy the token with USD (USD -> Token)
          // Use 'usd' for fiat purchases instead of 'usdt' for crypto-to-crypto
          const sourceToken = message.toLowerCase().includes('buy') ? 'usd' : 'usdt';
          const exchangeInfo = await changeNowService.getExchangeInfo(sourceToken, userIntent.specificToken, 1);
          
          let exchangeText = '';
          
          if (exchangeInfo.fromCurrency && exchangeInfo.toCurrency) {
            const fromToken = exchangeInfo.fromCurrency;
            const toToken = exchangeInfo.toCurrency;
            
            const sourceDisplayName = sourceToken.toUpperCase() === 'USD' ? 'USD' : 'USDT';
            exchangeText = `Buy ${toToken.name} (${toToken.ticker.toUpperCase()}) with ${sourceDisplayName}\n\n`;
            
            // Minimum exchange amount
            if (exchangeInfo.minAmount) {
              exchangeText += `Minimum: ${exchangeInfo.minAmount.minAmount} ${fromToken.ticker.toUpperCase()}\n`;
            }
            
            // Exchange range (limits)
            if (exchangeInfo.exchangeRange) {
              const range = exchangeInfo.exchangeRange;
              exchangeText += `Limits: ${range.minAmount || 'N/A'} - ${range.maxAmount || 'Unlimited'} ${fromToken.ticker.toUpperCase()}\n`;
            }
            
            // Exchange rate and fees
            if (exchangeInfo.exchangeAmount) {
              const rate = exchangeInfo.exchangeAmount;
              exchangeText += `Rate: 1 ${fromToken.ticker.toUpperCase()} = ${rate.estimatedAmount} ${toToken.ticker.toUpperCase()}\n`;
            }
            
            // Market info (fees and processing time)
            if (exchangeInfo.marketInfo) {
              const market = exchangeInfo.marketInfo;
              if (market.fee !== undefined) {
                exchangeText += `Fee: ${(market.fee * 100).toFixed(2)}%\n`;
              }
              if (market.flow) {
                exchangeText += `Flow: ${market.flow}\n`;
              }
            }
            
            exchangeText += `\nProcessing: ~5-30 minutes\n`;
            exchangeText += `Cross-chain swaps available\n\n`;
            // Normalize token symbols for URL generation
            const normalizeTokenSymbol = (symbol) => {
              const normalized = symbol.toLowerCase();
              // Handle common ChangeNOW API symbol variations
              if (normalized.includes('usd') && !normalized.includes('usdt')) return 'USD';
              if (normalized === 'usdt' || normalized.includes('usdt')) return 'USDT';
              if (normalized === 'ton' || normalized.includes('ton')) return 'TON';
              return symbol.toUpperCase();
            };
            
            const fromSymbol = normalizeTokenSymbol(fromToken.ticker);
            const toSymbol = normalizeTokenSymbol(toToken.ticker);
            
            // For "buy [token]" operations, show the appropriate source
            const userIntent = message.toLowerCase().includes('buy') ? `Buy ${toSymbol}` : 
                              message.toLowerCase().includes('sell') ? `Sell ${fromSymbol}` :
                              message.toLowerCase().includes('trade') ? `Trade ${fromSymbol} for ${toSymbol}` :
                              `Swap ${fromSymbol} to ${toSymbol}`;
            
            exchangeText += `Ready to ${userIntent.toLowerCase()}?\nVisit: https://changenow.io\nSwap: ${fromSymbol} → ${toSymbol}`;
            
            // Update context awareness with exchange data
            updateContextAwareness('exchange_data', `${fromSymbol}_${toSymbol}`.toLowerCase(), {
              source: 'ChangeNOW',
              from_currency: fromToken.ticker.toUpperCase(),
              to_currency: toToken.ticker.toUpperCase(),
              min_amount: exchangeInfo.minAmount?.minAmount,
              max_amount: exchangeInfo.exchangeRange?.maxAmount,
              exchange_rate: exchangeInfo.exchangeAmount?.estimatedAmount,
              fee_percentage: exchangeInfo.marketInfo?.fee ? (exchangeInfo.marketInfo.fee * 100).toFixed(2) : null,
              processing_time: '5-30 minutes',
              available: true
            })
            
          } else {
            exchangeText = `"${userIntent.specificToken.toUpperCase()}" not available for exchange\n\nTry popular tokens like:\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Solana (SOL)\n• Cardano (ADA)`;
            
            // Update context awareness even for unavailable tokens
            updateContextAwareness('exchange_data', userIntent.specificToken.toLowerCase(), {
              source: 'ChangeNOW',
              available: false,
              reason: 'Token not supported'
            })
          }
          
          // Update the specific bubble
          setChangeNowBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: exchangeText, loading: false }
              : bubble
          ))
          
          // 🧠 Update AI context with ChangeNOW data
          const changeNowContext = {
            changenow_data: {
              coin: userIntent.specificToken,
              exchange_data: data,
              timestamp: new Date().toISOString(),
              source: 'ChangeNOW API'
            }
          };
          
          // Update global context for AI
          if (window.contextAwarenessData) {
            window.contextAwarenessData = {
              ...window.contextAwarenessData,
              ...changeNowContext
            };
          } else {
            window.contextAwarenessData = changeNowContext;
          }
          
          // Also update local state to keep them in sync
          setContextAwarenessData(prev => ({
            ...prev,
            ...changeNowContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with ChangeNOW data:', changeNowContext);
        } catch (e) {
          console.error('ChangeNOW error:', e)
          // Update the specific bubble with error
          setChangeNowBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: `ChangeNOW API Error\n\nCouldn't fetch exchange data for ${userIntent.specificToken.toUpperCase()}\n\nTry asking for:\n• "buy bitcoin"\n• "swap ethereum"\n• "trade solana"`, loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep ChangeNOW bubble visible - building conversation bubble map

    // 0x Protocol integration is now handled by AI function calling
    // No bubble interface needed - AI handles swaps directly
    let swapBubbleCreated = false;
    if (false && mentions0x) { // Disabled - using AI function calling instead
      console.log('🎯 0x Protocol triggered!');
      // Parse swap information from user message
      // parseSwapMessage removed - now using AI function calling for swaps
      const swapInfo = null;
      console.log('📊 Parsed swap info:', swapInfo);
      
      // Also check if user is providing an amount for a previous swap request
      let finalSwapInfo = swapInfo;
      if (!swapInfo) {
        // Check if message is just a number and we have swap context from conversation
        const amountMatch = message.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
        if (amountMatch && conversationHistory.length > 0) {
          console.log('🔍 User provided amount, looking for swap context...');
          console.log('📜 Conversation history:', conversationHistory);
          
          // Look for recent swap context in conversation - use dynamic token detection
          const recentMessages = conversationHistory.slice(-4); // Last 4 messages
          console.log('📝 Recent messages:', recentMessages);
          const swapContextMessage = recentMessages.find(msg => 
            msg.role === 'assistant' && 
            /how much.*(?:swap|trade|exchange)|(?:swap|trade|exchange).*how much/i.test(msg.content)
          );
          
          if (swapContextMessage) {
            console.log('🔄 Found swap context message:', swapContextMessage.content);
            
            // Use the same token detection logic as the main function
            const contextWords = swapContextMessage.content.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [];
            const knownCryptos = [
              'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
              'polygon', 'matic', 'dogecoin', 'doge', 'chainlink', 'link', 'litecoin', 'ltc',
              'polkadot', 'dot', 'avalanche', 'avax', 'cosmos', 'atom', 'uniswap', 'uni',
              'shiba', 'shib', 'pepe', 'bonk', 'popcat', 'wif', 'ton', 'usdt', 'usdc',
              'bnb', 'xrp', 'ripple', 'stellar', 'xlm', 'vechain', 'vet', 'tron', 'trx',
              'icp', 'hbar', 'hedera', 'near', 'algo', 'algorand', 'fil', 'filecoin'
            ];
            
            const contextTokens = contextWords.filter(word => knownCryptos.includes(word));
            console.log('🪙 Found tokens in context:', contextTokens);
            
            if (contextTokens.length >= 2) {
              console.log('✅ Reconstructing swap with dynamic tokens...');
              const extractedAmount = amountMatch[1];
              console.log('🔢 Raw amount extracted:', extractedAmount);
              console.log('🔢 Amount type:', typeof extractedAmount);
              console.log('🔢 Amount truthy?', !!extractedAmount);
              
              finalSwapInfo = {
                sellToken: contextTokens[0].toUpperCase(),
                buyToken: contextTokens[1].toUpperCase(), 
                sellAmount: extractedAmount,
                hasAmount: true
              };
              console.log('📊 Reconstructed swap info:', finalSwapInfo);
              console.log('🔢 Final sellAmount:', finalSwapInfo.sellAmount);
            } else {
              console.log('❌ Not enough tokens found in context:', contextTokens);
            }
          }
        }
      }
      
      if (finalSwapInfo) {
        console.log('✅ Valid swap info found, validating pair...');
        
        // First validate the pair before creating bubble
        ;(async () => {
          try {
            // Format swap data for 0x API
            // formatSwapForAPI removed - now using AI function calling for swaps
            const formattedSwap = finalSwapInfo;
            
            // Get swap price from 0x API
            const swapData = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/zerox/price?chainId=1&sellToken=${formattedSwap.sellToken}&buyToken=${formattedSwap.buyToken}&sellAmount=${formattedSwap.sellAmount}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dev-token',
                'Origin': window.location.origin
              }
            });
            
            const response = await swapData.json();
            const data = response.success ? response.data : null;
            
            if (data) {
              console.log('✅ Pair validated successfully, creating bubble...');
              swapBubbleCreated = true;
              
              // Create new 0x Protocol bubble instance ONLY after validation
              const newBubble = {
                id: Date.now() + Math.random(), // Unique ID
                title: `${finalSwapInfo.sellToken} → ${finalSwapInfo.buyToken} - 0x Protocol`,
                content: `Getting swap quote for ${finalSwapInfo.sellAmount || 'amount'} ${finalSwapInfo.sellToken} to ${finalSwapInfo.buyToken}...`,
                loading: true,
                originalQuery: message // Store the original user message for OpenAI extraction
              }
              
              setZeroXBubbles(prev => [...prev, newBubble]);
              
              let swapText = `**${finalSwapInfo.sellToken} → ${finalSwapInfo.buyToken} Swap Quote**\n\n`;
              // Calculate display amounts - sellAmount is already human-readable, buyAmount needs conversion
              const sellAmount = finalSwapInfo.sellAmount; // Already human-readable (e.g., "100")
              const buyAmount = data.buyAmount ? (parseInt(data.buyAmount) / Math.pow(10, formattedSwap.buyTokenInfo.decimals)).toFixed(6) : 'N/A';
              
              swapText += `📊 **Get**: ${buyAmount} ${finalSwapInfo.buyToken}\n`;
              swapText += `💰 **Pay**: ${sellAmount} ${finalSwapInfo.sellToken}\n`;
              
              // Add gas costs if available
              if (data.gasCosts) {
                swapText += `⛽ **Gas Fee**: $${data.gasCosts.gasCostUSD.toFixed(2)} (${data.gasCosts.gasUnits.toLocaleString()} units at ${data.gasCosts.gasPriceGwei.toFixed(1)} gwei)\n`;
              }
              
              // Add route information
              if (data.route && data.route.tokens) {
                const routeTokens = data.route.tokens.map(t => t.symbol).join(' → ');
                swapText += `🔗 **Route**: ${routeTokens}\n`;
              }
              
              // Add liquidity sources
              if (data.route && data.route.fills) {
                swapText += `🔄 **Sources**: ${data.route.fills.map(f => f.source).join(', ')}\n`;
              }
              
              swapText += `\n🎯 **Best execution** across multiple DEXs\n`;
              swapText += `🔒 **Secure** on-chain settlement\n`;
              
              // Add allowance info if needed
              if (data.issues && data.issues.allowance) {
                swapText += `\n⚠️  **Approval Required**: AllowanceHolder contract\n`;
              }
              
              swapText += `\n🚀 **Ready to Swap**\n`;
              swapText += `Click the swap button to confirm and execute this trade.`;
              
              // Update context awareness with real swap data
              updateContextAwareness('swap_data', `${finalSwapInfo.sellToken}_${finalSwapInfo.buyToken}`, {
                source: '0x Protocol',
                sellToken: finalSwapInfo.sellToken,
                buyToken: finalSwapInfo.buyToken,
                sellAmount: sellAmount,
                buyAmount: buyAmount,
                gasCostUSD: data.gasCosts?.gasCostUSD || 0,
                route: data.route,
                allowanceTarget: data.allowanceTarget,
                needsApproval: !!data.issues?.allowance,
                timestamp: new Date().toISOString()
              })
              // Update bubble with quote first
              setZeroXBubbles(prev => prev.map(bubble => 
                bubble.id === newBubble.id 
                  ? { ...bubble, content: swapText, loading: false }
                  : bubble
              ));
              
              // Send swap quote to AI for natural language response
              const aiMessage = `I found a swap quote for you:\n\n${swapText}\n\nWould you like me to explain any part of this quote or help you proceed with the swap?`;
              
              // Add AI message to chat
              setMessages(prev => [...prev, {
                type: 'ai',
                content: aiMessage,
                timestamp: Date.now(),
                id: `ai_${Date.now()}`
              }]);
              
              // Store transaction data for the swap button
              newBubble.transactionData = {
                formattedSwap,
                sellAmount,
                buyAmount,
                gasData: data.gasCosts
              };
            } else {
              // Pair validation failed - don't create bubble, just log error
              console.log('❌ Pair validation failed - no bubble created');
              console.log('Response:', response);
            }
          } catch (e) {
            console.error('0x Protocol validation error:', e);
            console.log('❌ Pair validation failed due to error - no bubble created');
            // Reset loading state if validation fails
            setIsLoading(false);
            setShowInput(true); // Always show input after error
          }
        })()
      } else if (mentionedCoin) {
        // Fallback for mentions without clear swap intent
        const newBubble = {
          id: Date.now() + Math.random(),
          title: `${mentionedCoin.toUpperCase()} DEX Info - 0x Protocol`,
          content: `**${mentionedCoin.toUpperCase()} Trading Information**\n\n🔄 Available for swapping on 0x Protocol\n\n**Try asking:**\n• "swap 100 ${mentionedCoin.toLowerCase()} to usdt"\n• "trade ${mentionedCoin.toLowerCase()} for eth"\n• "exchange ${mentionedCoin.toLowerCase()} to usdc"\n\n💡 **Tip**: Specify amount and target token for real quotes!`,
          loading: false,
          originalQuery: message
        }
        setZeroXBubbles(prev => [...prev, newBubble])
      } else {
        console.log('❌ No valid swap info parsed from message:', message);
      }
    }
    // Keep 0x Protocol bubble visible - building conversation bubble map

    // Handle OKX DEX bubble - trigger for swap requests, exchange rate queries, OR token holder queries when OKX plugin is enabled
    if ((userIntent.wantsSwap || userIntent.wantsExchangeRate || userIntent.wantsTokenHolders) && isPluginEnabled('okx')) {
      const newBubble = {
        id: Date.now() + Math.random(),
        title: userIntent.wantsTokenHolders ? 'OKX Token Holders' : 
               userIntent.wantsExchangeRate ? 'OKX Exchange Rates' : 'OKX DEX Aggregator',
        content: userIntent.wantsTokenHolders ? 
          `**OKX Token Holders**\n\n👥 Top token holders analysis\n\n**Your Request:**\n"${message}"\n\n**Getting holder data...**\n\n**Features:**\n• Top 20 holders\n• Whale tracking\n• Distribution analysis\n• Real-time data` :
          userIntent.wantsExchangeRate ? 
          `**OKX Exchange Rates**\n\n📊 Real-time cryptocurrency exchange rates\n\n**Your Request:**\n"${message}"\n\n**Getting current rates...**\n\n**Features:**\n• Live exchange rates\n• Multi-chain support\n• Accurate pricing\n• Wide token coverage` :
          `**OKX DEX Trading**\n\n🔄 Multi-chain DEX aggregator for optimal swap rates\n\n**Your Request:**\n"${message}"\n\n**Getting real quote...**\n\n**Supported Features:**\n• Multi-chain trading\n• Competitive swap rates\n• Low slippage\n• Wide token support`,
        loading: true,
        originalQuery: message
      }
      setOkxBubbles(prev => [...prev, newBubble])
      
      // Fetch OKX DEX data
      ;(async () => {
        try {
          let okxContent = '';
          
          // Handle token holder queries
          if (userIntent.wantsTokenHolders && userIntent.specificToken) {
            try {
              const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/okx/token-holders-query`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
                },
                body: JSON.stringify({ userQuery: message })
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                  okxContent = `**${userIntent.specificToken.toUpperCase()} Top Holders**\n\n`;
                  okxContent += `👥 **Top ${data.data.length} Token Holders:**\n\n`;
                  
                  data.data.slice(0, 10).forEach((holder, index) => {
                    const shortAddress = `${holder.holderWalletAddress.slice(0, 6)}...${holder.holderWalletAddress.slice(-4)}`;
                    okxContent += `**${index + 1}.** ${shortAddress}\n`;
                    okxContent += `   💰 ${holder.holdAmount} ${userIntent.specificToken.toUpperCase()}\n\n`;
                  });
                  
                  okxContent += `**Analysis:**\n`;
                  okxContent += `• Top holder owns ${data.data[0]?.holdAmount} tokens\n`;
                  okxContent += `• Distribution shows ${data.data.length > 5 ? 'good' : 'concentrated'} decentralization\n`;
                  okxContent += `• Whale activity can impact price movements\n\n`;
                  okxContent += `💡 These are the biggest ${userIntent.specificToken.toUpperCase()} whales! 🐋`;
                } else {
                  throw new Error('No holder data available');
                }
              } else {
                throw new Error('Failed to fetch holder data');
              }
            } catch (error) {
              console.error('Failed to fetch token holders:', error);
              okxContent = `**${userIntent.specificToken?.toUpperCase() || 'Token'} Holders**\n\n`;
              okxContent += `🚫 **Unable to fetch holder data**\n\n`;
              okxContent += `The OKX API is currently unavailable (possibly geo-blocked).\n\n`;
              okxContent += `**Supported tokens:** PEPE, USDT, USDC, WETH, SHIB, UNI, LINK, MATIC, CRO, DAI\n\n`;
              okxContent += `Try again later or check the token's contract on Etherscan.`;
            }
          }
          // Handle swap requests
          else {
            // Parse tokens from message
            const tokenPattern = /(\d+(?:\.\d+)?)\s*([A-Za-z]+)\s+(?:to|for)\s+([A-Za-z]+)/i;
            const match = message.match(tokenPattern);
            
            if (match) {
            const [, amount, fromToken, toToken] = match;
            
            // Get quote from OKX DEX
            const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/okx/quote`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify({
                fromTokenSymbol: fromToken.toUpperCase(),
                toTokenSymbol: toToken.toUpperCase(),
                amount: parseFloat(amount),
                chainId: 1 // Default to Ethereum
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              
              okxContent = `**OKX DEX Quote**\n\n`;
              okxContent += `🔄 Swap: ${amount} ${fromToken.toUpperCase()} → ${toToken.toUpperCase()}\n\n`;
              
              if (data.quote) {
                okxContent += `💰 You'll receive: ~${data.quote.toAmount} ${toToken.toUpperCase()}\n`;
                okxContent += `📊 Rate: 1 ${fromToken.toUpperCase()} = ${data.quote.price} ${toToken.toUpperCase()}\n`;
                okxContent += `⛽ Gas estimate: ${data.quote.estimatedGas || 'N/A'}\n\n`;
                okxContent += `✅ Ready to execute on OKX DEX`;
              } else {
                okxContent += `⚠️ Quote data unavailable\n\n`;
                okxContent += `Try popular pairs like:\n`;
                okxContent += `• ETH → USDC\n`;
                okxContent += `• USDT → ETH\n`;
                okxContent += `• WBTC → USDT`;
              }
            } else {
              throw new Error('Failed to fetch OKX quote');
            }
          } else {
            // Show general OKX info if no specific swap detected
            if (userIntent.wantsExchangeRate) {
              okxContent = `**OKX Exchange Rates**\n\n`;
              okxContent += `📊 Real-time Cryptocurrency Exchange Rates\n\n`;
              okxContent += `**Popular Pairs:**\n`;
              okxContent += `• ETH/USDC: ~$2,650\n`;
              okxContent += `• BTC/USDT: ~$63,500\n`;
              okxContent += `• SOL/USDC: ~$145\n`;
              okxContent += `• MATIC/USDT: ~$0.42\n\n`;
              okxContent += `**Features:**\n`;
              okxContent += `• Live price feeds\n`;
              okxContent += `• Multi-chain support\n`;
              okxContent += `• Accurate pricing\n`;
              okxContent += `• 24/7 updates\n\n`;
              okxContent += `💡 Try: "ETH to USDC rate" or "BTC exchange rate"`;
            } else {
              okxContent = `**OKX DEX Features**\n\n`;
              okxContent += `🔄 Multi-chain DEX Aggregator\n\n`;
              okxContent += `**Supported Chains:**\n`;
              okxContent += `• Ethereum\n`;
              okxContent += `• BNB Chain\n`;
              okxContent += `• Polygon\n`;
              okxContent += `• Arbitrum\n`;
              okxContent += `• Optimism\n\n`;
              okxContent += `**Benefits:**\n`;
              okxContent += `• Best rates across DEXs\n`;
              okxContent += `• Low slippage\n`;
              okxContent += `• MEV protection\n`;
              okxContent += `• No KYC required\n\n`;
              okxContent += `💡 Try: "swap 100 USDC to ETH"`;
            }
          }
          }
          
          // Update bubble with OKX data
          setOkxBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: okxContent, loading: false }
              : bubble
          ))
        } catch (error) {
          console.error('Failed to fetch OKX data:', error);
          
          // Show demo content instead of error
          let demoContent = `**OKX DEX Demo**\n\n`;
          
          if (match) {
            const [, amount, fromToken, toToken] = match;
            demoContent += `🔄 Swap: ${amount} ${fromToken.toUpperCase()} → ${toToken.toUpperCase()}\n\n`;
            demoContent += `📊 Example Quote:\n`;
            demoContent += `• You'll receive: ~${(parseFloat(amount) * 0.00042).toFixed(4)} ${toToken.toUpperCase()}\n`;
            demoContent += `• Rate: 1 ${fromToken.toUpperCase()} = 0.00042 ${toToken.toUpperCase()}\n`;
            demoContent += `• Slippage: 0.5%\n`;
            demoContent += `• Gas: ~$2.50\n\n`;
          }
          
          demoContent += `**OKX DEX Features:**\n`;
          demoContent += `• 300+ DEX sources\n`;
          demoContent += `• Best price routing\n`;
          demoContent += `• MEV protection\n`;
          demoContent += `• Multi-chain support\n\n`;
          demoContent += `⚠️ Note: Live quotes require OKX API setup`;
          
          setOkxBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: demoContent, loading: false }
              : bubble
          ))
        }
      })()
    }

    // Handle TON Center bubble - trigger for TON-related queries when TON Center plugin is enabled
    if (isPluginEnabled('toncenter') && (message.toLowerCase().includes('ton') || message.toLowerCase().includes('toncoin') || message.toLowerCase().includes('ton center'))) {
      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'TON Center',
        content: `**TON Blockchain Data**\n\n⛓️ The Open Network blockchain analytics\n\n**Your Query:**\n"${message}"\n\n**Loading TON data...**\n\n**Available Features:**\n• Account balances & transactions\n• Jetton (token) information\n• Smart contract interactions\n• Real-time TON price`,
        loading: true,
        originalQuery: message
      }
      setTonCenterBubbles(prev => [...prev, newBubble])
      
      // Fetch TON data and update AI context
      ;(async () => {
        try {
          // Simulate TON Center data fetch
          const tonContext = {
            ton_center_data: {
              query: message,
              blockchain: 'The Open Network',
              features: ['Account balances', 'Jetton information', 'Smart contracts', 'Real-time price'],
              timestamp: new Date().toISOString(),
              source: 'TON Center API'
            }
          };
          
          // Update global context for AI
          window.contextAwarenessData = {
            ...window.contextAwarenessData,
            ...tonContext
          };
          
          // Update local state
          setContextAwarenessData(prev => ({
            ...prev,
            ...tonContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with TON Center data:', tonContext);
          
          // Update bubble to show it's loaded
          setTonCenterBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, loading: false }
              : bubble
          ))
        } catch (error) {
          console.error('TON Center error:', error)
        }
      })()
    }

    // Handle Chainbase bubble - trigger when user says "chainbase"
    const lowerMessage = message.toLowerCase();
    
    if (isPluginEnabled('chainbase') && lowerMessage.includes('chainbase')) {
      // Detect which chain was mentioned
      let detectedChain = 'ethereum'; // default
      if (lowerMessage.includes('ton') || lowerMessage.includes('toncoin')) detectedChain = 'ton';
      else if (lowerMessage.includes('sui')) detectedChain = 'sui';
      else if (lowerMessage.includes('polygon') || lowerMessage.includes('matic')) detectedChain = 'polygon';
      else if (lowerMessage.includes('bnb') || lowerMessage.includes('bsc') || lowerMessage.includes('binance')) detectedChain = 'bsc';
      else if (lowerMessage.includes('avalanche') || lowerMessage.includes('avax')) detectedChain = 'avalanche';
      else if (lowerMessage.includes('arbitrum') || lowerMessage.includes('arb')) detectedChain = 'arbitrum';
      else if (lowerMessage.includes('optimism') || lowerMessage.includes('op')) detectedChain = 'optimism';
      else if (lowerMessage.includes('base')) detectedChain = 'base';
      else if (lowerMessage.includes('fantom') || lowerMessage.includes('ftm')) detectedChain = 'fantom';
      else if (lowerMessage.includes('aptos') || lowerMessage.includes('apt')) detectedChain = 'aptos';
      else if (lowerMessage.includes('merlin')) detectedChain = 'merlin';
      else if (lowerMessage.includes('zksync')) detectedChain = 'zksync';
      else if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) detectedChain = 'ethereum';

      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'Chainbase - ' + detectedChain.toUpperCase() + ' APY',
        content: `**${detectedChain.toUpperCase()} Blockchain Data**\n\n🌐 Real-time APY and TVL data\n\n**Your Query:**\n"${message}"\n\n**Loading ${detectedChain} APY data...**\n\n**Available Data:**\n• Live APY rates\n• Total Value Locked (TVL)\n• Top protocols\n• Yield opportunities`,
        loading: true,
        originalQuery: message,
        detectedChain: detectedChain
      }
      setChainbaseBubbles(prev => [...prev, newBubble])
      
      // Fetch Chainbase data and update AI context
      ;(async () => {
        try {
          // Chainbase context with detected chain info
          const chainbaseContext = {
            chainbase_data: {
              query: message,
              detected_chain: detectedChain,
              chain_name: chainName,
              features: ['Latest block', 'Token prices', 'DeFi data', 'NFT data', 'Cross-chain analytics'],
              timestamp: new Date().toISOString(),
              source: 'Chainbase API'
            }
          };
          
          // Update global context for AI
          window.contextAwarenessData = {
            ...window.contextAwarenessData,
            ...chainbaseContext
          };
          
          // Update local state
          setContextAwarenessData(prev => ({
            ...prev,
            ...chainbaseContext,
            last_updated: new Date().toISOString()
          }));
          
          console.log('🧠 Updated AI context with Chainbase data:', chainbaseContext);
          
          // Update bubble to show it's loaded
          setChainbaseBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, loading: false }
              : bubble
          ))
        } catch (error) {
          console.error('Chainbase error:', error)
        }
      })()
    }

    // Portfolio bubble handled below with intent system - removed duplicate
    
    // Handle Alchemy bubble - now intent-based for portfolio viewing!
    if ((userIntent.wantsPortfolio || userIntent.wantsAlchemy) && isPluginEnabled('alchemy')) {
      // Create new Alchemy bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Portfolio',
        content: 'Loading wallet tokens...',
        loading: true
      }
      
      setAlchemyBubbles(prev => [...prev, newBubble])
      
      // Update context awareness with alchemy data
      updateContextAwareness('blockchain_data', 'alchemy', {
        source: 'Alchemy',
        connected: true,
        message: 'Alchemy bubble opened - detailed analytics available'
      })
      
      // After a short delay, mark as loaded
      setTimeout(() => {
        setAlchemyBubbles(prev => prev.map(bubble => 
          bubble.id === newBubble.id 
            ? { ...bubble, loading: false }
            : bubble
        ))
      }, 500)
    }

    // Send message to Olivia - SMART CONTEXT OPTIMIZATION
    // 🕐 DELAY AI RESPONSE: Give bubbles time to load data first
    setTimeout(async () => {
      try {
        log('📤 Sending message to Olivia AI (after bubble loading delay)...')
        
        // 🧠 SMART DECISION: Check if we have relevant bubble context
        const hasRelevantContext = () => {
        const contextData = window.contextAwarenessData || {};
        
        // Check if user mentions any tokens we have context for
        const mentionedTokens = words.filter(word => knownCryptos.includes(word));
        log('🧠 Checking context for mentioned tokens:', mentionedTokens);
        log('🧠 Available context data:', Object.keys(contextData));
        
        for (const category in contextData) {
          for (const token in contextData[category]) {
            if (mentionedTokens.includes(token)) {
              log(`🎯 Found relevant bubble context for: ${token} in ${category}`);
              return true;
            }
          }
        }
        log('❌ No relevant bubble context found');
        return false;
      };
      
      // 🚀 OPTIMIZATION: Use bubble-first approach
      const useSearchFromStart = /\b(news|latest|why|what happened|breaking|analysis|expert|opinion|trend)\b/i.test(message);
      const hasContext = hasRelevantContext();
      
      // 🚀 INSTANT RESPONSE: For simple price queries with bubble data (handle typos)
      const priceWords = ['price', 'cost', 'value', 'worth', 'much'];
      const isSimplePriceQuery = words.some(word => {
        // Check exact matches
        if (priceWords.includes(word)) return true;
        // Check for common typos (edit distance = 1)
        if (word === 'rpeice' || word === 'pirce' || word === 'peice') return true;
        return false;
      }) && !useSearchFromStart;
      
      log('🔍 Price query detection:', { isSimplePriceQuery, useSearchFromStart, words });
      
      // Conversation history already built at top of function
      
      log('🧠 Conversation history being sent:', conversationHistory);
      
      // Skip AI response if we successfully created a swap bubble OR if there's ongoing swap context
      const hasRecentSwapContext = conversationHistory.slice(-4).some(msg => 
        /swap|trade|exchange|pepe|usdc|usdt|eth|btc/i.test(msg.content) && 
        /how much|which token|want to swap/i.test(msg.content)
      );
      
      if (swapBubbleCreated || (mentions0x && hasRecentSwapContext)) {
        console.log('🔄 Skipping AI response - swap processing or context detected');
        setIsLoading(false);
        return;
      }
      
      let result;
      if (hasContext && !useSearchFromStart) {
        if (isSimplePriceQuery) {
          log('⚡ AI WITH BUBBLE DATA: Letting AI respond conversationally with bubble context, no search');
        } else {
          log('⚡ FAST MODE: Using bubble context first, no search needed');
        }
        result = await sendMessage(message, conversationHistory, false, false); // Bubble context + conversation history, no search
      } else {
        log('🌐 COMPLETE MODE: Enabling search for comprehensive answer');
        result = await sendMessage(message, conversationHistory, true, false); // With search + conversation history
      }
      
      if (!result) {
        // sendMessage returned false - connection failed after waiting
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: 'Sorry, I\'m having trouble connecting to my AI service right now. Please try again in a moment. In the meantime, you can still see cryptocurrency data above!' 
        }])
        setIsLoading(false)
        setShowInput(true)
      }
      // If successful, the WebSocket message handler will take care of the response
      
      } catch (error) {
        logError('Failed to send message:', error)
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: 'I\'m currently offline, but you can still get crypto data from the bubbles above! Try asking about Bitcoin, Ethereum, or other coins.' 
        }])
        setIsLoading(false)
        setShowInput(true) // Always show input after error
      }
    }, 2000); // 2 second delay to allow bubbles to load data
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Auto-initialize the chat on component mount
  useEffect(() => {
    log('🚀 Home.jsx: Auto-initializing chat on mount');
    setIsLoading(false) // Don't show loading initially
    setMessages([{
      type: 'ai',
      content: "Hey there, welcome to Olivia AI! Ask me about cryptocurrencies, trading, or anything Web3!"
    }]) // Show instant greeting
    setCurrentResponse('')
    setShowInput(true) // Show input immediately
    setUserInput('')
  }, [])



  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden">
      
      {/* WebSocket Status Debug (bottom-right) - Development Only */}
      {import.meta.env.VITE_NODE === 'development' && (
        <div className={`fixed bottom-4 right-4 text-white p-2 text-xs z-50 rounded ${
          isConnected ? 'bg-green-600' : isConnecting ? 'bg-yellow-600' : 'bg-red-600'
        }`}>
          {isConnected ? '🟢 AI Connected' : 
           isConnecting ? `🟡 Connecting... (${connectionAttempts}/10)` : 
           `🔴 AI Offline`}
          {!isConnected && (
            <div className="text-[10px] mt-1">
              Endpoint: {currentEndpointIndex + 1}/{wsEndpoints?.length || 0}
              <button 
                onClick={connect}
                className="ml-2 px-1 py-0.5 bg-blue-600 hover:bg-blue-700 rounded text-[9px]"
                disabled={isConnecting}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
      

      
      {/* Animated Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute bg-green-300 rounded-full opacity-60"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>

      {/* Conversation Display - Properly centered with safe area */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10 pt-8 pb-36">
        <div className="text-center max-w-xl w-full">
            
            {/* Chat Messages - Scroll up and fade older messages */}
            <div className="space-y-3 mb-6 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ maxHeight: '40vh' }}>
              {messages.map((msg, index) => {
                // Calculate fade: newest messages (highest index) = 100% opacity
                // Older messages (lower index) = fade and become smaller
                const totalMessages = messages.length;
                const messageAge = totalMessages - index - 1; // 0 = newest, higher = older
                const fadeOpacity = Math.max(0.1, 1 - (messageAge * 0.12)); // Keep minimum visibility
                const scale = Math.max(0.85, 1 - (messageAge * 0.05)); // Slightly shrink older messages
                
                // Don't render messages that are too old (keep last 15 messages max)
                if (messageAge > 15) return null;
                
                return (
                  <div 
                    key={index}
                    className={`text-sm transition-all duration-500 ${
                      msg.type === 'user' 
                        ? 'text-green-300' 
                        : 'text-white'
                    }`}
                    style={{
                      opacity: fadeOpacity,
                      transform: `scale(${scale})`,
                      marginBottom: messageAge > 5 ? '0.25rem' : '0.75rem' // Compress older messages
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        let content = msg.content;
                        
                        // First, convert markdown links [text](url) to HTML links
                        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                          const cleanUrl = url.trim().replace(/[.,;!?]*$/, '');
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `<a id="${uniqueId}" href="#" data-url="${cleanUrl}" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${text}</a>`;
                        });
                        
                        // Create a temporary marker to avoid processing already converted links
                        const linkMarker = '___CONVERTED_LINK___';
                        content = content.replace(/<a[^>]*>.*?<\/a>/g, `${linkMarker}$&${linkMarker}`);
                        
                        // Convert URLs with protocol to clickable links (only if not already a link)
                        content = content.replace(/(^|[^>]|[\s])(https?:\/\/[^\s<>]+)/g, (match, prefix, url) => {
                          // Skip if we're inside a converted link
                          if (match.includes(linkMarker)) return match;
                          
                          const cleanUrl = url.replace(/[.,;!?]+$/, '');
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `${prefix}<a id="${uniqueId}" href="#" data-url="${cleanUrl}" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${cleanUrl}</a>`;
                        });
                        
                        // Convert URLs without protocol (www.example.com) to clickable links
                        content = content.replace(/(^|[\s])(www\.[a-zA-Z0-9][a-zA-Z0-9\-._]*[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s<>]*)?)/g, (match, prefix, url) => {
                          // Skip if we're inside a converted link
                          if (match.includes(linkMarker)) return match;
                          
                          const cleanUrl = url.replace(/[.,;!?]+$/, '');
                          const fullUrl = 'https://' + cleanUrl;
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `${prefix}<a id="${uniqueId}" href="#" data-url="${fullUrl}" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${cleanUrl}</a>`;
                        });
                        
                        // Remove the link markers
                        content = content.replace(new RegExp(linkMarker, 'g'), '');
                        
                        return content;
                      })()
                    }}
                  >
                  </div>
                );
              }).filter(Boolean)}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Current Response or Loading */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <img 
                  src="/THINKING ICON.gif" 
                  alt="Thinking" 
                  className="w-12 h-12"
                />
                <div className="text-white/80 text-sm">
                  {loadingText}...
                </div>
              </div>
            ) : currentResponse ? (
              <div className="text-white text-sm opacity-90">
                {currentResponse}
              </div>
            ) : messages.length === 0 && (
              <div className="text-white/50 text-sm">
                Starting conversation...
              </div>
            )}
            
            {/* Simple Input */}
            {showInput && (
              <div className="fixed bottom-52 left-4 right-4 z-20">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-black border border-green-300 rounded-lg text-white text-sm pl-3 pr-12 py-2 text-center focus:outline-none focus:border-green-400"
                    style={{
                      caretColor: 'white'
                    }}
                    placeholder="Ask me anything..."
                  />
                  {/* Olivia Logo Submit Button */}
                  <button
                    onClick={handleSendMessage}
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
          </div>
        </div>
      {/* Render all Lurky bubble instances - only if plugin enabled */}
      {isPluginEnabled('lurky') && lurkyBubbles.map(bubble => (
        <FloatingLurkyBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setLurkyBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all CoinGecko bubble instances - only if plugin enabled */}
      {isPluginEnabled('coingecko') && coinGeckoBubbles.map(bubble => (
        <FloatingCoinGeckoBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setCoinGeckoBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all CoinStats bubble instances - only if plugin enabled */}
      {isPluginEnabled('coinstats') && coinstatsBubbles.map(bubble => (
        <FloatingCoinStatsBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setCoinstatsBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all ICP bubble instances - only if plugin enabled */}
      {isPluginEnabled('icp') && icpBubbles.map(bubble => (
        <FloatingICPBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setIcpBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title || "ICP Status"}
          content={bubble.content}
          status={bubble.status || 'error'}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all Hedera bubble instances - only if plugin enabled */}
      {isPluginEnabled('hedera') && hederaBubbles.map(bubble => (
        <FloatingHederaBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setHederaBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
        />
      ))}
      
      {/* Render all ChangeNOW bubble instances - only if plugin enabled */}
      {isPluginEnabled('changenow') && changeNowBubbles.map(bubble => (
        <FloatingChangeNowBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setChangeNowBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
          originalQuery={bubble.originalQuery} // Pass the original user query for OpenAI extraction
        />
      ))}
      
      {/* Render all 0x Protocol bubble instances - only if plugin enabled */}
      {isPluginEnabled('zerox') && zeroXBubbles.map(bubble => (
        <FloatingZeroXBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setZeroXBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
          originalQuery={bubble.originalQuery} // Pass the original user query for OpenAI extraction
          transactionData={bubble.transactionData} // Pass transaction data for swap execution
        />
      ))}
      
      {/* Render all OKX DEX bubble instances - only if plugin enabled */}
      {isPluginEnabled('okx') && okxBubbles.map(bubble => (
        <FloatingOKXBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setOkxBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
          originalQuery={bubble.originalQuery}
          transactionData={bubble.transactionData}
        />
      ))}
      
      {/* Render all TON Center bubble instances - only if plugin enabled */}
      {isPluginEnabled('toncenter') && tonCenterBubbles.map(bubble => (
        <FloatingTONCenterBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setTonCenterBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
          originalQuery={bubble.originalQuery}
          transactionData={bubble.transactionData}
        />
      ))}
      
      {/* Render all Chainbase bubble instances - only if plugin enabled */}
      {isPluginEnabled('chainbase') && chainbaseBubbles.map(bubble => (
        <FloatingChainbaseBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setChainbaseBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
          originalQuery={bubble.originalQuery}
          transactionData={bubble.transactionData}
          detectedChain={bubble.detectedChain}
        />
      ))}
      
      {/* Render all Portfolio bubble instances - only if plugin enabled */}
      {isPluginEnabled('portfolio') && portfolioBubbles.map(bubble => (
        <FloatingPortfolioBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setPortfolioBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all Alchemy bubble instances - only if plugin enabled */}
      {isPluginEnabled('alchemy') && alchemyBubbles.map(bubble => (
        <FloatingAlchemyBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setAlchemyBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all Web Search bubble instances - only if plugin enabled */}
      {isPluginEnabled('websearch') && webSearchBubbles.map(bubble => (
        <FloatingWebSearchBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setWebSearchBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all News bubble instances - only if plugin enabled */}
        {isPluginEnabled('news') && newsBubbles.map(bubble => (
          <FloatingNewsBubble
            key={bubble.id}
            isOpen={true}
            onClose={() => setNewsBubbles(prev => prev.filter(b => b.id !== bubble.id))}
            title={bubble.title}
            content={bubble.content}
            loading={bubble.loading}
            addParticlesToSwarm={addParticlesToSwarm}
          />
        ))}
        
        {isPluginEnabled('twitter') && twitterBubbles.map(bubble => (
          <FloatingTwitterBubble
            key={bubble.id}
            isOpen={true}
            onClose={() => setTwitterBubbles(prev => prev.filter(b => b.id !== bubble.id))}
            title={bubble.title}
            content={bubble.content}
            loading={bubble.loading}
            addParticlesToSwarm={addParticlesToSwarm}
          />
        ))}
        
        {isPluginEnabled('protokols') && protokolsBubbles.map(bubble => (
          <FloatingProtokolsBubble
            key={bubble.id}
            isOpen={true}
            onClose={() => setProtokolsBubbles(prev => prev.filter(b => b.id !== bubble.id))}
            title={bubble.title}
            content={bubble.content}
            loading={bubble.loading}
            addParticlesToSwarm={addParticlesToSwarm}
          />
        ))}
      
      {/* In-App Browser */}
      <InAppBrowser
        isOpen={browserOpen}
        url={browserUrl}
        onClose={handleCloseBrowser}
      />
    </div>
  )
}

