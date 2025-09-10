import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useInternetIdentity } from '../contexts/InternetIdentityContext'
import { isPluginEnabled, AVAILABLE_PLUGINS } from '../utils/pluginManager'
import { useAccountUpgrade } from '../hooks/useAccountUpgrade';
import { icpService } from '../api/services/icp.service.js';
// API services now handled by AI backend through tool calls
// import { lurkyService, coingeckoService, coinstatsService, hgraphService, changeNowService } from '../api';
import { log, error as logError } from '../utils/logger.js';
import FloatingLurkyBubble from '../components/ui/FloatingLurkyBubble.jsx';
import FloatingCoinGeckoBubble from '../components/ui/FloatingCoinGeckoBubble.jsx';
import FloatingCoinStatsBubble from '../components/ui/FloatingCoinStatsBubble.jsx';
import FloatingICPBubble from '../components/ui/FloatingICPBubble.jsx';
import FloatingHederaBubble from '../components/ui/FloatingHederaBubble.jsx';
import FloatingChangeNowBubble from '../components/ui/FloatingChangeNowBubble.jsx';
import FloatingZeroXBubble from '../components/ui/FloatingZeroXBubble.jsx';
import FloatingPortfolioBubble from '../components/ui/FloatingPortfolioBubble.jsx';
import FloatingAlchemyBubble from '../components/ui/FloatingAlchemyBubble.jsx';
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
  const [portfolioBubbles, setPortfolioBubbles] = useState([])
  const [alchemyBubbles, setAlchemyBubbles] = useState([])

  // Context awareness data for AI chat
  const [contextAwarenessData, setContextAwarenessData] = useState({
    market_data: {},
    sentiment_data: {},
    exchange_data: {},
    blockchain_data: {},
    portfolio_data: {},
    last_updated: null
  })

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
      'coinstats': 'coinstats',
      'coinstats (olivia thought)': 'coinstats',
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

  // Token detection and bubble creation is now handled by AI backend through tool calls
  // This function is deprecated - AI automatically detects tokens and creates bubbles via tool calls
  const parseAIResponseForCoins = useCallback(async (aiMessage) => {
    log('🤖 Token detection now handled by AI backend through tool calls - no frontend API calls needed');
    // The AI backend will automatically:
    // 1. Detect token mentions in user messages
    // 2. Make API calls through tool calls (getCoinData, searchCoins, etc.)
    // 3. Create bubble data and send to frontend via bubbleUpdates
    // 4. Frontend receives bubbles via aiBubbleUpdate events
    return;
  }, []);

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
      
      if (data.type === 'stream_chunk') {
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

  // Listen for AI bubble updates
  useEffect(() => {
    const handleAIBubbleUpdate = (event) => {
      const bubbleData = event.detail;
      log('🫧 Received AI bubble update:', bubbleData);
      
      // Add bubble based on type
      switch (bubbleData.type) {
        case 'coinstats':
          setCoinstatsBubbles(prev => [...prev, bubbleData]);
          break;
        case 'lurky':
          setLurkyBubbles(prev => [...prev, bubbleData]);
          break;
        case 'zerox':
          setZeroXBubbles(prev => [...prev, bubbleData]);
          break;
        case 'changenow':
          setChangeNowBubbles(prev => [...prev, bubbleData]);
          break;
        case 'alchemy':
          setAlchemyBubbles(prev => [...prev, bubbleData]);
          break;
        default:
          log('🫧 Unknown bubble type:', bubbleData.type);
      }
    };

    window.addEventListener('aiBubbleUpdate', handleAIBubbleUpdate);
    return () => window.removeEventListener('aiBubbleUpdate', handleAIBubbleUpdate);
  }, [])

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
    
    // Extract potential token names - be much more conservative
    const words = message.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [];
    
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
      'cfx', 'conflux', 'pudgy', 'penguins', 'ethena', 'curve', 'dao', 'crv'
    ];
    
    log('🔍 Known cryptos detected in message:', words.filter(word => knownCryptos.includes(word)));
    
    // Only consider words that are actually known cryptocurrencies
    const potentialTokens = words.filter(word => 
      knownCryptos.includes(word)
    );
    
    // Use the first known crypto token found
    const mentionedCoin = potentialTokens[0];
    
    // Detect price queries
    const mentionsPrice = /\b(price|prices|cost|value|worth|usd|dollar)\b/i.test(message)
    
    // Detect Hedera mentions
    const mentionsHedera = /\b(hedera|hbar|hashgraph|hgraph)\b/i.test(message)
    
    // Detect CoinStats mentions (coin and price triggers)
    const mentionsCoinstats = /\b(coin|coins|price|prices)\b/i.test(message)
    
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
    const mentionsPortfolio = /\b(wallet|balance|holdings|portfolio|my tokens|my coins|what do i have|what's in my wallet)\b/i.test(message)
    
    // Detect Alchemy mentions (detailed tokens, all tokens, token list)
    const mentionsAlchemy = /\b(all tokens|token list|detailed balance|all my tokens|every token|alchemy)\b/i.test(message)
    console.log('🔮 Alchemy trigger check:', { message, mentionsAlchemy, isPluginEnabled: isPluginEnabled('alchemy') })
    
    // Add user message to conversation
    setMessages(prev => [...prev, { type: 'user', content: message }])
    setUserInput('')
    setShowInput(false)
    setIsLoading(true)
    setCurrentResponse('')

    // Lurky bubble creation is now handled by AI backend through tool calls
    // AI will automatically detect coin mentions and create Lurky bubbles via getTrendingCoins/getCoinInsights tool calls
    log('🤖 Lurky bubble creation now handled by AI backend through tool calls');
    // Keep Lurky bubble visible - building conversation bubble map

    // CoinGecko bubble creation temporarily disabled - needs backend tool call support
    // TODO: Add CoinGecko to PLUGIN_API_MAP with backend routes and tool calls
    if (mentionsPrice && mentionedCoin && isPluginEnabled('coingecko')) {
      log('🚧 CoinGecko plugin enabled but no backend tool call support yet - use CoinStats instead');
    } else if (mentionsPrice && isPluginEnabled('coingecko')) {
      log('🚧 CoinGecko plugin enabled but no backend tool call support yet - use CoinStats instead');
    }
    // Keep CoinGecko bubble visible - building conversation bubble map

    // CoinStats bubble creation is now handled by AI backend through tool calls
    // AI will automatically detect token mentions and create CoinStats bubbles via getCoinData/searchCoins/getMarketData tool calls
    log('🤖 CoinStats bubble creation now handled by AI backend through tool calls');
    // Keep CoinStats bubble visible - building conversation bubble map

    // Hedera bubble creation temporarily disabled - needs backend tool call support
    // TODO: Add Hedera to PLUGIN_API_MAP with backend routes and tool calls
    if (mentionsHedera && isPluginEnabled('hedera')) {
      log('🚧 Hedera plugin enabled but no backend tool call support yet - needs backend implementation');
    }
    // Keep Hedera bubble visible - building conversation bubble map

    // ChangeNOW bubble creation is now handled by AI backend through tool calls
    // AI will automatically detect exchange mentions and create ChangeNOW bubbles via getExchangeRate/createTransaction tool calls
    log('🤖 ChangeNOW bubble creation now handled by AI backend through tool calls');
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
            const swapData = await fetch(`http://localhost:3001/api/zerox/price?chainId=1&sellToken=${formattedSwap.sellToken}&buyToken=${formattedSwap.buyToken}&sellAmount=${formattedSwap.sellAmount}`, {
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
              // Calculate display amounts
              const sellAmount = formattedSwap.sellAmount ? (parseInt(formattedSwap.sellAmount) / Math.pow(10, formattedSwap.sellTokenInfo.decimals)).toFixed(4) : finalSwapInfo.sellAmount;
              const buyAmount = data.buyAmount ? (parseInt(data.buyAmount) / Math.pow(10, formattedSwap.buyTokenInfo.decimals)).toFixed(4) : 'N/A';
              
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

    // Handle Portfolio bubble logic (wallet/balance mentions)
    if (mentionsPortfolio && isPluginEnabled('portfolio')) {
      // Create new Portfolio bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Portfolio',
        content: 'Loading wallet data...',
        loading: true
      }
      
      setPortfolioBubbles(prev => [...prev, newBubble])
      
      // The bubble component itself handles fetching wallet data via wagmi hooks
      // Update context awareness with wallet connection status
      updateContextAwareness('portfolio_data', 'wallet', {
        source: 'Portfolio',
        connected: true, // The bubble will update this with actual data
        message: 'Portfolio bubble opened - wallet data available in bubble'
      })
      
      // After a short delay, mark as loaded (the bubble component handles actual data)
      setTimeout(() => {
        setPortfolioBubbles(prev => prev.map(bubble => 
          bubble.id === newBubble.id 
            ? { ...bubble, loading: false }
            : bubble
        ))
      }, 500)
    }
    // Keep Portfolio bubble visible - building conversation bubble map
    
    // Create Alchemy bubble if mentioned and plugin is enabled
    if (mentionsAlchemy && isPluginEnabled('alchemy')) {
      // Create new Alchemy bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Alchemy',
        content: 'Loading detailed token analytics...',
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
      
      // Skip AI response only if we successfully created a swap bubble (not for mentions0x)
      // Allow AI to handle swap requests through function calling
      if (swapBubbleCreated) {
        console.log('🔄 Skipping AI response - swap bubble created');
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
    <div className="flex flex-col gap-6 relative h-full w-full overflow-hidden bg-black">
      
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

      {/* Conversation Display - Just Above Input */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10 pb-36" style={{marginBottom: '-120px'}}>
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
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-black border border-green-300 rounded-lg text-white text-sm px-3 py-2 text-center focus:outline-none focus:border-green-400"
                  style={{
                    caretColor: 'white'
                  }}
                />
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
      
      {/* In-App Browser */}
      <InAppBrowser
        isOpen={browserOpen}
        url={browserUrl}
        onClose={handleCloseBrowser}
      />
    </div>
  )
}
