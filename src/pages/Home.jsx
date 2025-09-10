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
import FloatingAlchemyBubble from '../components/ui/FloatingAlchemyBubble.jsx';
import FloatingTransactionBubble from '../components/ui/FloatingTransactionBubble.jsx';
import FloatingPortfolioBubble0x from '../components/ui/FloatingPortfolioBubble0x.jsx';
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
  const [alchemyBubbles, setAlchemyBubbles] = useState([])
  const [transactionBubbles, setTransactionBubbles] = useState([])
  const [portfolioBubbles0x, setPortfolioBubbles0x] = useState([])

  // Context awareness data for AI chat
  const [contextAwarenessData, setContextAwarenessData] = useState({
    market_data: {},
    sentiment_data: {},
    exchange_data: {},
    blockchain_data: {},
    wallet_data: {},
    last_updated: null
  })

  // Sync context data to window object for AI access
  useEffect(() => {
    window.contextAwarenessData = contextAwarenessData;
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
      'coinstats': 'coinstats',
      'coinstats (olivia thought)': 'coinstats',
      'hgraph': 'hedera',
      'hedera': 'hedera',
      'changenow': 'changenow',
      '0x protocol': 'zerox',
      'icp': 'icp',
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
  const { isConnected, sendMessage, subscribe, connect, isConnecting, connectionAttempts, currentEndpointIndex, wsEndpoints, walletAddress, isWalletConnected, walletConnector } = useWebSocket()
  const { principal, isAuthenticated } = useInternetIdentity()
  const { forceShowUpgrade } = useAccountUpgrade(); // ICP upgrade

  // Update wallet data in AI context when wallet connects/disconnects
  useEffect(() => {
    if (isWalletConnected && walletAddress) {
      setContextAwarenessData(prev => ({
        ...prev,
        wallet_data: {
          connected: true,
          address: walletAddress,
          connector: walletConnector?.name || 'Unknown',
          message: 'Wallet connected - use WalletConnect to view portfolio'
        },
        last_updated: new Date().toISOString()
      }));
    } else {
      setContextAwarenessData(prev => ({
        ...prev,
        wallet_data: {
          connected: false,
          address: null,
          connector: null,
          message: 'No wallet connected - connect wallet to view portfolio'
        },
        last_updated: new Date().toISOString()
      }));
    }
  }, [isWalletConnected, walletAddress, walletConnector])

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
      console.log('🫧 DEBUG: Received AI bubble update:', bubbleData);
      log('🫧 Received AI bubble update:', bubbleData);
      
      // Add bubble based on type
      switch (bubbleData.type) {
        case 'coinstats':
          console.log('🫧 Adding CoinStats bubble:', bubbleData);
          setCoinstatsBubbles(prev => [...prev, bubbleData]);
          // Send CoinStats data to AI context
          setContextAwarenessData(prev => ({
            ...prev,
            coinstats_data: bubbleData.content,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent AI CoinStats data to context:', bubbleData.content);
          break;
        case 'lurky':
          console.log('🫧 Adding Lurky bubble:', bubbleData);
          setLurkyBubbles(prev => [...prev, bubbleData]);
          // Send Lurky data to AI context
          setContextAwarenessData(prev => ({
            ...prev,
            lurky_data: bubbleData.content,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent AI Lurky data to context:', bubbleData.content);
          break;
        case 'zerox':
          console.log('🫧 Adding 0x bubble:', bubbleData);
          setZeroXBubbles(prev => [...prev, bubbleData]);
          // 0x data is handled by AI tools - no context needed
          break;
        case 'changenow':
          console.log('🫧 Adding ChangeNOW bubble:', bubbleData);
          setChangeNowBubbles(prev => [...prev, bubbleData]);
          // Send ChangeNOW data to AI context
          setContextAwarenessData(prev => ({
            ...prev,
            changenow_data: bubbleData.content,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent AI ChangeNOW data to context:', bubbleData.content);
          break;
        case 'alchemy':
          console.log('🫧 Adding Alchemy bubble:', bubbleData);
          setAlchemyBubbles(prev => [...prev, bubbleData]);
          // Send Alchemy data to AI context
          setContextAwarenessData(prev => ({
            ...prev,
            alchemy_data: bubbleData.content,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent AI Alchemy data to context:', bubbleData.content);
          break;
        case 'portfolio':
          console.log('🫧 Portfolio bubble data received:', bubbleData);
          
          // Only show bubble if we have actual token data
          const hasTokens = bubbleData.portfolioData?.balances?.length > 0;
          
          if (hasTokens) {
            console.log('✅ Portfolio has tokens, showing bubble');
            setPortfolioBubbles0x(prev => [...prev, bubbleData]);
            
            // Send Portfolio data to AI context
            setContextAwarenessData(prev => ({
              ...prev,
              wallet_data: {
                ...prev.wallet_data,
                portfolio_info: bubbleData.content,
                last_portfolio_update: new Date().toISOString()
              },
              last_updated: new Date().toISOString()
            }));
            console.log('📊 Sent AI Portfolio data to context:', bubbleData.content);
          } else {
            console.log('❌ No tokens found, not showing bubble');
          }
          break;
        case 'icp':
          console.log('🫧 Adding ICP bubble:', bubbleData);
          setIcpBubbles(prev => [...prev, bubbleData]);
          // Send ICP data to AI context
          setContextAwarenessData(prev => ({
            ...prev,
            icp_data: bubbleData.content,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent AI ICP data to context:', bubbleData.content);
          break;
        default:
          console.log('🫧 Unknown bubble type:', bubbleData.type);
          log('🫧 Unknown bubble type:', bubbleData.type);
      }
    };

    console.log('🫧 DEBUG: Setting up aiBubbleUpdate listener');
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
    
    // Detect price queries - more flexible detection
    const mentionsPrice = /\b(price|prices|cost|value|worth|usd|dollar|market|markets|how much|what.*price|current|fetching|issue.*fetch)\b/i.test(message)
    
    // If user mentions a known crypto without explicit price words, assume they want price info
    const wantsPriceInfo = mentionedCoin && !mentionsPrice && message.length < 20
    
    
    // Detect CoinStats mentions (coin and price triggers)
    const mentionsCoinstats = /\b(coin|coins|price|prices|market|markets)\b/i.test(message)
    
    
    // Detect 0x Protocol mentions (swap/trade existing tokens) - be more specific to avoid false triggers
    const mentions0x = /\b(swap|trade|exchange|dex|aggregator|0x|best rate|compare rates|cheapest swap|sell|buy.*for)\b/i.test(message) && !/\b(wallet|balance|holdings|portfolio|what do i have|show me|my tokens|my coins)\b/i.test(message)
    
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
    
    
    
    // Detect Alchemy mentions (detailed tokens, all tokens, token list)
    const mentionsAlchemy = /\b(all tokens|token list|detailed balance|all my tokens|every token|alchemy)\b/i.test(message)
    console.log('🔮 Alchemy trigger check:', { message, mentionsAlchemy, isPluginEnabled: isPluginEnabled('alchemy') })
    
    // Detect Portfolio mentions (wallet, balance, holdings triggers) - NEW 0x Portfolio System
    const mentionsPortfolio = /\b(wallet|balance|holdings|portfolio|my tokens|my coins|what do i have|what's in my wallet|show.*balance|check.*wallet)\b/i.test(message)
    console.log('💰 Portfolio trigger check:', { message, mentionsPortfolio, isPluginEnabled: isPluginEnabled('zerox') })
    
    // Add user message to conversation
    setMessages(prev => [...prev, { type: 'user', content: message }])
    setUserInput('')
    setShowInput(false)
    setIsLoading(true)
    setCurrentResponse('')

    // Detect Lurky mentions (trending, analytics triggers)
    const mentionsLurky = /\b(trending|trends|analytics|insights|social|sentiment|viral|hot|popular|lurky)\b/i.test(message)
    
    // Detect TRENDING TOKEN questions (needs multiple data sources)
    const mentionsTrendingTokens = /\b(trending.*token|pumping.*token|hot.*token|trending.*coin|pumping.*coin|what.*pumping|tokens.*trending|coins.*trending)\b/i.test(message)
    
    // Detect CoinGecko mentions (crypto prices, market data)
    const mentionsCoinGecko = /\b(gecko|coingecko|crypto|bitcoin|ethereum|btc|eth|coin|coins|price|prices)\b/i.test(message)
    
    // Detect ICP mentions (internet computer, blockchain)
    const mentionsICP = /\b(icp|internet computer|dfinity|canister|blockchain|network)\b/i.test(message)
    
    // Detect Hedera mentions (hedera, hashgraph)
    const mentionsHedera = /\b(hedera|hbar|hashgraph|hgraph|consensus|gossip)\b/i.test(message)
    
    // Detect ChangeNOW mentions (exchange, swap, buy)
    const mentionsChangeNow = /\b(changenow|change now|exchange|swap|buy|purchase|convert|fiat|card)\b/i.test(message)
    
    // Detect WalletConnect mentions (wallet, balance, connect)
    const mentionsWalletConnect = /\b(wallet|balance|connect|walletconnect|holdings|my tokens|my coins)\b/i.test(message)
    
    // Detect transaction success messages
    const mentionsTransactionSuccess = /\b(transaction sent successfully|hash:|0x[a-fA-F0-9]{64})\b/i.test(message)
    
    // COMPREHENSIVE TRENDING ANALYSIS - Multiple bubbles for trending questions
    if (mentionsTrendingTokens) {
      console.log('🔥 TRENDING TOKENS QUESTION - Triggering multiple data sources')
      
      // 1. Lurky for social sentiment
      if (isPluginEnabled('lurky')) {
        const lurkyBubble = {
          id: Date.now() + Math.random(),
          title: 'Lurky - Social Trending',
          content: 'Loading social trending data...',
          loading: true
        }
        setLurkyBubbles(prev => [...prev, lurkyBubble])
        
        fetch('/api/lurky/trending?limit=20')
          .then(response => response.json())
          .then(data => {
            const coins = data.data?.coins || data.coins || [];
            const trendingData = coins.slice(0, 15).map(coin => ({
              symbol: coin.symbol?.toUpperCase(),
              sentiment: coin.sentiment,
              mentions: coin.mentions,
              trend: coin.trend || 'bullish'
            }));
            
            setLurkyBubbles(prev => prev.map(bubble => 
              bubble.id === lurkyBubble.id 
                ? { 
                    ...bubble, 
                    loading: false, 
                    content: `🔥 TRENDING (Social):\n${trendingData.map(coin => 
                      `${coin.symbol}: ${coin.sentiment} (${coin.mentions} mentions)`
                    ).join('\n') || 'Social trending data loaded'}`
                  }
                : bubble
            ))
            
            setContextAwarenessData(prev => ({
              ...prev,
              lurky_trending: trendingData,
              last_updated: new Date().toISOString()
            }));
          })
          .catch(error => {
            console.error('Error fetching Lurky trending:', error)
            setLurkyBubbles(prev => prev.map(bubble => 
              bubble.id === lurkyBubble.id 
                ? { ...bubble, loading: false, content: 'Error loading social trending' }
                : bubble
            ))
          })
      }
      
      // 2. CoinStats for market gainers/losers
      if (isPluginEnabled('coinstats')) {
        const coinStatsBubble = {
          id: Date.now() + Math.random() + 1,
          title: 'CoinStats - Market Gainers',
          content: 'Loading market gainers/losers...',
          loading: true
        }
        setCoinstatsBubbles(prev => [...prev, coinStatsBubble])
        
        fetch('/api/coinstats/markets?limit=50&currency=USD&sortBy=rank')
          .then(response => response.json())
          .then(data => {
            const coins = data.data?.coins || data.coins || [];
            const gainers = coins.filter(coin => coin.priceChange1d > 5).slice(0, 10);
            
            setCoinstatsBubbles(prev => prev.map(bubble => 
              bubble.id === coinStatsBubble.id 
                ? { 
                    ...bubble, 
                    loading: false, 
                    content: `📈 TOP GAINERS:\n${gainers.map(coin => 
                      `${coin.symbol}: $${coin.price?.toFixed(4)} (+${coin.priceChange1d?.toFixed(1)}%)`
                    ).join('\n') || 'Market data loaded'}`
                  }
                : bubble
            ))
            
            setContextAwarenessData(prev => ({
              ...prev,
              coinstats_gainers: gainers,
              last_updated: new Date().toISOString()
            }));
          })
          .catch(error => {
            console.error('Error fetching CoinStats gainers:', error)
            setCoinstatsBubbles(prev => prev.map(bubble => 
              bubble.id === coinStatsBubble.id 
                ? { ...bubble, loading: false, content: 'Error loading market gainers' }
                : bubble
            ))
          })
      }
      
      // 3. CoinGecko for trending coins
      if (isPluginEnabled('coingecko')) {
        const coinGeckoBubble = {
          id: Date.now() + Math.random() + 2,
          title: 'CoinGecko - Trending',
          content: 'Loading CoinGecko trending...',
          loading: true
        }
        setCoinGeckoBubbles(prev => [...prev, coinGeckoBubble])
        
        fetch('https://api.coingecko.com/api/v3/search/trending')
          .then(response => response.json())
          .then(data => {
            const trending = data.coins?.slice(0, 10) || [];
            
            setCoinGeckoBubbles(prev => prev.map(bubble => 
              bubble.id === coinGeckoBubble.id 
                ? { 
                    ...bubble, 
                    loading: false, 
                    content: `🦎 TRENDING (CoinGecko):\n${trending.map(coin => 
                      `${coin.item?.symbol?.toUpperCase()}: ${coin.item?.name} (Rank #${coin.item?.market_cap_rank || 'N/A'})`
                    ).join('\n') || 'CoinGecko trending loaded'}`
                  }
                : bubble
            ))
            
            setContextAwarenessData(prev => ({
              ...prev,
              coingecko_trending: trending,
              last_updated: new Date().toISOString()
            }));
          })
          .catch(error => {
            console.error('Error fetching CoinGecko trending:', error)
            setCoinGeckoBubbles(prev => prev.map(bubble => 
              bubble.id === coinGeckoBubble.id 
                ? { ...bubble, loading: false, content: 'Error loading CoinGecko trending' }
                : bubble
            ))
          })
      }
    }
    
    // Create Lurky bubble with real API data (fallback for non-trending questions)
    else if (mentionsLurky) {
      console.log('🎯 Creating Lurky bubble for:', message)
      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'Lurky - Analytics',
        content: 'Loading trending data...',
        loading: true
      }
      
      setLurkyBubbles(prev => [...prev, newBubble])
      
      // Fetch TRENDING data from Lurky API (social buzz)
      fetch('/api/lurky/trending?limit=20')
        .then(response => response.json())
        .then(data => {
          const coins = data.data?.coins || data.coins || [];
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `Trending Coins:\n${coins.slice(0, 10).map(coin => 
                    `${coin.symbol?.toUpperCase()}: ${coin.sentiment} (${coin.mentions} mentions)`
                  ).join('\n') || 'Trending data loaded'}`
                }
              : bubble
          ))
        })
        .catch(error => {
          console.error('Error fetching Lurky data:', error)
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, loading: false, content: 'Error loading trending data' }
              : bubble
          ))
        })
    }

    // CoinGecko bubble creation temporarily disabled - needs backend tool call support
    // TODO: Add CoinGecko to PLUGIN_API_MAP with backend routes and tool calls
    if (mentionsPrice && mentionedCoin && isPluginEnabled('coingecko')) {
      log('🚧 CoinGecko plugin enabled but no backend tool call support yet - use CoinStats instead');
    } else if (mentionsPrice && isPluginEnabled('coingecko')) {
      log('🚧 CoinGecko plugin enabled but no backend tool call support yet - use CoinStats instead');
    }
    // Keep CoinGecko bubble visible - building conversation bubble map

    // Debug logging for bubble detection
    console.log('🔍 Bubble Detection Debug:', {
      message,
      mentionsPrice,
      mentionsCoinstats,
      isCoinstatsEnabled: isPluginEnabled('coinstats'),
      allPluginStates: Object.keys(AVAILABLE_PLUGINS || {}).reduce((acc, key) => {
        acc[key] = isPluginEnabled(key);
        return acc;
      }, {})
    })
    
    // Create multiple bubbles for comprehensive AI data - USER INPUT TRIGGERED
    
    // For specific token price queries - trigger price-related bubbles
    if (mentionedCoin && (mentionsPrice || wantsPriceInfo)) {
      console.log('🎯 Creating price bubbles for token:', mentionedCoin)
      
      // CoinGecko bubble for specific token price
      const coinGeckoBubble = {
        id: Date.now() + Math.random(),
        title: 'CoinGecko - Token Price',
        content: `Loading ${mentionedCoin} price data...`,
        loading: true
      }
      setCoinGeckoBubbles(prev => [...prev, coinGeckoBubble])
      
      // Fetch CoinGecko TRENDING data (social buzz + price data)
      fetch(`https://api.coingecko.com/api/v3/search/trending`)
        .then(response => response.json())
        .then(data => {
          const tokenData = data[mentionedCoin.toLowerCase()];
          const priceData = {
            token: mentionedCoin.toUpperCase(),
            price: tokenData?.usd?.toFixed(4) || 'N/A',
            change24h: tokenData?.usd_24h_change?.toFixed(2) || 'N/A',
            marketCap: (tokenData?.usd_market_cap / 1000000000)?.toFixed(2) || 'N/A'
          };
          
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === coinGeckoBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `${priceData.token} Price:\n$${priceData.price}\n24h Change: ${priceData.change24h > 0 ? '+' : ''}${priceData.change24h}%\nMarket Cap: $${priceData.marketCap}B`
                }
              : bubble
          ))
          
          // Send price data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            coingecko_data: priceData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent CoinGecko data to AI:', priceData);
        })
        .catch(error => {
          console.error('Error fetching CoinGecko data:', error)
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === coinGeckoBubble.id 
              ? { ...bubble, loading: false, content: `Error loading ${mentionedCoin} price data` }
              : bubble
          ))
        })
      
      // CoinStats bubble for market context
      const coinStatsBubble = {
        id: Date.now() + Math.random() + 1,
        title: 'CoinStats - Market Context',
        content: 'Loading market context...',
        loading: true
      }
      setCoinstatsBubbles(prev => [...prev, coinStatsBubble])
      
      // Fetch MARKET OVERVIEW with gainers/losers from CoinStats
      fetch('/api/coinstats/markets?limit=50&currency=USD&sortBy=rank')
        .then(response => response.json())
        .then(data => {
          const coins = data.data?.coins || data.coins || [];
          const marketData = coins.slice(0, 5).map(coin => ({
            symbol: coin.symbol?.toUpperCase(),
            price: coin.price?.toFixed(2),
            change24h: coin.change24h?.toFixed(2)
          }));
          
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === coinStatsBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `Market Context:\n${marketData.map(coin => 
                    `${coin.symbol}: $${coin.price} (${coin.change24h > 0 ? '+' : ''}${coin.change24h}%)`
                  ).join('\n')}`
                }
              : bubble
          ))
          
          // Send market data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            coinstats_data: marketData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent CoinStats data to AI:', marketData);
        })
        .catch(error => {
          console.error('Error fetching CoinStats data:', error)
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === coinStatsBubble.id 
              ? { ...bubble, loading: false, content: 'Error loading market context' }
              : bubble
          ))
        })
      
      // Lurky bubble for trending/sentiment data
      const lurkyBubble = {
        id: Date.now() + Math.random() + 2,
        title: 'Lurky - Sentiment Data',
        content: 'Loading sentiment data...',
        loading: true
      }
      setLurkyBubbles(prev => [...prev, lurkyBubble])
      
      // Fetch Lurky sentiment data
      fetch('/api/lurky/coins?limit=10&page=0&sort_by=mentions&sort_dir=desc')
        .then(response => response.json())
        .then(data => {
          const coins = data.data?.coins || data.coins || [];
          const sentimentData = coins.slice(0, 5).map(coin => ({
            symbol: coin.symbol?.toUpperCase(),
            sentiment: coin.sentiment,
            mentions: coin.mentions
          }));
          
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === lurkyBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `Sentiment Data:\n${sentimentData.map(coin => 
                    `${coin.symbol}: ${coin.sentiment} (${coin.mentions} mentions)`
                  ).join('\n')}`
                }
              : bubble
          ))
          
          // Send sentiment data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            lurky_data: sentimentData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent Lurky data to AI:', sentimentData);
        })
        .catch(error => {
          console.error('Error fetching Lurky data:', error)
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === lurkyBubble.id 
              ? { ...bubble, loading: false, content: 'Error loading sentiment data' }
              : bubble
          ))
        })
    }
    
    // For general market queries - trigger market bubbles
    else if (mentionsPrice || mentionsCoinstats) {
      console.log('🎯 Creating market bubbles for:', message)
      
      // CoinStats bubble for market overview
      const coinStatsBubble = {
        id: Date.now() + Math.random(),
        title: 'CoinStats - Market Data',
        content: 'Loading market data...',
        loading: true
      }
      setCoinstatsBubbles(prev => [...prev, coinStatsBubble])
      
      // Fetch MARKET OVERVIEW with gainers/losers from CoinStats
      fetch('/api/coinstats/markets?limit=50&currency=USD&sortBy=rank')
        .then(response => response.json())
        .then(data => {
          const coins = data.data?.coins || data.coins || [];
          const marketData = coins.slice(0, 10).map(coin => ({
            symbol: coin.symbol?.toUpperCase(),
            price: coin.price?.toFixed(2),
            change24h: coin.change24h?.toFixed(2)
          }));
          
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === coinStatsBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `Top 10 Cryptocurrencies:\n${marketData.map(coin => 
                    `${coin.symbol}: $${coin.price} (${coin.change24h > 0 ? '+' : ''}${coin.change24h}%)`
                  ).join('\n') || 'Market data loaded'}`
                }
              : bubble
          ))
          
          // Send market data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            coinstats_data: marketData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent CoinStats market data to AI:', marketData);
        })
        .catch(error => {
          console.error('Error fetching CoinStats data:', error)
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === coinStatsBubble.id 
              ? { ...bubble, loading: false, content: 'Error loading market data' }
              : bubble
          ))
        })
      
      // Lurky bubble for trending data
      const lurkyBubble = {
        id: Date.now() + Math.random() + 1,
        title: 'Lurky - Trending Data',
        content: 'Loading trending data...',
        loading: true
      }
      setLurkyBubbles(prev => [...prev, lurkyBubble])
      
      // Fetch Lurky trending data
      fetch('/api/lurky/coins?limit=10&page=0&sort_by=mentions&sort_dir=desc')
        .then(response => response.json())
        .then(data => {
          const coins = data.data?.coins || data.coins || [];
          const trendingData = coins.slice(0, 10).map(coin => ({
            symbol: coin.symbol?.toUpperCase(),
            sentiment: coin.sentiment,
            mentions: coin.mentions
          }));
          
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === lurkyBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `Trending Coins:\n${trendingData.map(coin => 
                    `${coin.symbol}: ${coin.sentiment} (${coin.mentions} mentions)`
                  ).join('\n') || 'Trending data loaded'}`
                }
              : bubble
          ))
          
          // Send trending data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            lurky_data: trendingData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent Lurky trending data to AI:', trendingData);
        })
        .catch(error => {
          console.error('Error fetching Lurky data:', error)
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === lurkyBubble.id 
              ? { ...bubble, loading: false, content: 'Error loading trending data' }
              : bubble
          ))
        })
    }

    // Trigger AI to create CoinGecko bubble with real data
    if (mentionsCoinGecko) {
      console.log('🎯 Triggering AI to create CoinGecko bubble for:', message)
      // The AI will automatically call getCoinGeckoData() tool and create a bubble
    }

    // Trigger AI to create ICP bubble with real data
    if (mentionsICP) {
      console.log('🎯 Triggering AI to create ICP bubble for:', message)
      // The AI will automatically call getICPStatus() tool and create a bubble
    }

    // Create Hedera bubble for hashgraph queries - ALWAYS CREATE BUBBLE
    if (mentionsHedera) {
      console.log('🎯 Creating Hedera bubble for:', message)
      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'Hedera - Blockchain',
        content: 'Loading Hedera network data...',
        loading: true
      }
      
      setHederaBubbles(prev => [...prev, newBubble])
      
      // Update context awareness
      updateContextAwareness('blockchain_data', 'hedera', {
        source: 'Hedera',
        connected: true,
        message: 'Hedera bubble opened - blockchain data available'
      })
      
      // Fetch HBAR price from CoinGecko API
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd&include_24hr_change=true&include_market_cap=true')
        .then(response => response.json())
        .then(data => {
          const hbar = data['hedera-hashgraph'];
          const hederaData = {
            token: 'HBAR',
            price: hbar?.usd?.toFixed(4) || 'N/A',
            change24h: hbar?.usd_24h_change?.toFixed(2) || 'N/A',
            marketCap: (hbar?.usd_market_cap / 1000000000)?.toFixed(2) || 'N/A',
            consensus: 'hashgraph'
          };
          
          let content = 'Hedera Hashgraph (HBAR):\n\n'
          if (hbar) {
            content += `Price: $${hederaData.price}\n`
            content += `24h Change: ${hederaData.change24h > 0 ? '+' : ''}${hederaData.change24h}%\n`
            content += `Market Cap: $${hederaData.marketCap}B\n\n`
            content += `Hedera is a distributed ledger technology\nusing hashgraph consensus algorithm.\nFast, fair, and secure transactions.`
          } else {
            content = 'Hedera Hashgraph data not available'
          }
          
          setHederaBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, loading: false, content: content }
              : bubble
          ))
          
          // Send Hedera data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            hedera_data: hederaData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent Hedera data to AI:', hederaData);
        })
        .catch(error => {
          console.error('Error fetching Hedera data:', error)
          setHederaBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, loading: false, content: 'Hedera Hashgraph (HBAR)\n\nPrice data unavailable\n\nHedera uses hashgraph consensus\nfor fast, secure transactions.' }
              : bubble
          ))
        })
    }

    // Create ChangeNOW bubble for exchange queries - ALWAYS CREATE BUBBLE
    if (mentionsChangeNow) {
      console.log('🎯 Creating ChangeNOW bubble for:', message)
      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'ChangeNOW - Exchange',
        content: 'Loading exchange data...',
        loading: true
      }
      
      setChangenowBubbles(prev => [...prev, newBubble])
      
      // Update context awareness
      updateContextAwareness('exchange_data', 'changenow', {
        source: 'ChangeNOW',
        connected: true,
        message: 'ChangeNOW bubble opened - exchange data available'
      })
      
      // Fetch real ChangeNOW data
      fetch('/api/changenow/currencies')
        .then(response => response.json())
        .then(data => {
          const currencies = data.data?.currencies || data.currencies || [];
          const exchangeData = currencies.slice(0, 10).map(currency => ({
            ticker: currency.ticker?.toUpperCase(),
            name: currency.name
          }));
          
          setChangenowBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { 
                  ...bubble, 
                  loading: false, 
                  content: `Available Currencies:\n${exchangeData.map(currency => 
                    `${currency.ticker}: ${currency.name}`
                  ).join('\n') || 'Exchange data loaded'}`
                }
              : bubble
          ))
          
          // Send exchange data to AI for context
          setContextAwarenessData(prev => ({
            ...prev,
            changenow_data: exchangeData,
            last_updated: new Date().toISOString()
          }));
          console.log('📊 Sent ChangeNOW data to AI:', exchangeData);
        })
        .catch(error => {
          console.error('Error fetching ChangeNOW data:', error)
          setChangenowBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, loading: false, content: 'Error loading exchange data' }
              : bubble
          ))
        })
    }

    // Create Transaction Success bubble - USER INPUT TRIGGERED
    if (mentionsTransactionSuccess) {
      console.log('🎯 Creating Transaction Success bubble for:', message)
      const newBubble = {
        id: Date.now() + Math.random(),
        title: '✅ Transaction Success',
        content: message,
        loading: false
      }
      
      setTransactionBubbles(prev => [...prev, newBubble])
    }

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

    // Create Portfolio bubble if mentioned and plugin is enabled - NEW Alchemy Portfolio System
    if (mentionsPortfolio && isPluginEnabled('zerox')) {
      // Don't create bubble immediately - wait for AI response with actual data
      console.log('💰 Portfolio mentioned, AI will handle bubble creation with data')
      
      // Update context awareness with wallet connection status
      updateContextAwareness('wallet_data', 'portfolio', {
        source: 'Alchemy Portfolio',
        connected: true,
        message: 'Alchemy Portfolio will be fetched via AI tool'
      })
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
      
      {/* Render all 0x Portfolio bubble instances - only if plugin enabled */}
      {isPluginEnabled('zerox') && portfolioBubbles0x.map(bubble => (
        <FloatingPortfolioBubble0x
          key={bubble.id}
          isOpen={true}
          onClose={() => setPortfolioBubbles0x(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          portfolioData={bubble.portfolioData}
        />
      ))}

      {/* Transaction Success Bubbles */}
      {transactionBubbles.map(bubble => (
        <FloatingTransactionBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setTransactionBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
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
