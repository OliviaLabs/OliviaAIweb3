import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import walletConnectLogo from '../../assets/wallet-connect.png';

const FloatingPortfolioBubble = ({ 
  isOpen, 
  onClose, 
  title = "WalletConnect", 
  content = "", 
  loading = false,
  addParticlesToSwarm 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    // Spread bubbles across the bottom third of screen
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100; // Random between bottom 100-400px
    return { x: startX, y: startY };
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const bubbleRef = useRef(null);
  const bubbleId = useRef(`portfolio-${Date.now()}`).current;
  
  // Wallet connection
  const { address, isConnected, chain } = useAccount();
  
  // Get native token balance (ETH, MATIC, etc.)
  const { data: nativeBalance, isLoading: balanceLoading } = useBalance({
    address: address,
    enabled: isConnected && isExpanded, // Only fetch when expanded
  });
  
  // Format portfolio data
  const [portfolioData, setPortfolioData] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  

  
  // Update global context for AI
  const updateAIContext = useCallback((data) => {
    // Initialize contextAwarenessData if it doesn't exist
    if (!window.contextAwarenessData) {
      window.contextAwarenessData = {};
    }
    
    window.contextAwarenessData = {
      ...window.contextAwarenessData,
      portfolio_data: {
        wallet: {
          data: data,
          timestamp: new Date().toISOString()
        }
      }
    };
    
    console.log('🧠 Portfolio context updated:', window.contextAwarenessData);
  }, []);
  
  // Track if we're already fetching to prevent duplicate calls
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);
  const [tokenPrices, setTokenPrices] = useState({});
  
  // Fetch token prices from CoinStats for any tokens in the wallet
  const fetchTokenPrices = useCallback(async (tokens) => {
    try {
      // Fetch prices for all tokens in parallel
      console.log('💰 Fetching prices for tokens:', tokens.map(t => t.symbol));
      
      const pricePromises = tokens.map(async (token) => {
        try {
          console.log(`💰 Fetching price for ${token.symbol}...`);
          const response = await fetch(`http://localhost:3001/api/coinstats/search?query=${token.symbol}&currency=USD`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN}`,
              'Origin': window.location.origin
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              const tokenData = data.data[0]; // Search returns array, take first result
              console.log(`💰 ✅ Got price for ${token.symbol}: $${tokenData.price}`);
              return {
                symbol: token.symbol,
                price: tokenData.price,
                name: tokenData.name
              };
            }
          } else {
            console.log(`💰 ❌ Failed to get price for ${token.symbol}: ${response.status} ${response.statusText}`);
          }
          return null;
        } catch (error) {
          console.error(`💰 ❌ Error fetching price for ${token.symbol}:`, error);
          return null;
        }
      });

      const prices = await Promise.all(pricePromises);
      const validPrices = prices.filter(price => price !== null);
      
      // Update the state with all token prices
      if (validPrices.length > 0) {
        const priceMap = {};
        validPrices.forEach(price => {
          priceMap[price.symbol] = price.price;
        });
        setTokenPrices(priceMap);
        console.log('💰 Updated token prices:', priceMap);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    }
  }, []);
  
  // Track fetch attempts to prevent infinite loops
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [lastFetchAddress, setLastFetchAddress] = useState(null);
  
  // Fetch token balances from Alchemy via microservice
  const fetchTokenBalances = useCallback(async () => {
    console.log('🔍 fetchTokenBalances called:', { address, isFetchingTokens, tokenBalancesLength: tokenBalances.length, lastFetchAddress, isExpanded });
    if (!address || isFetchingTokens || (tokenBalances.length > 0 && address === lastFetchAddress)) {
      console.log('🚫 Skipping fetch due to conditions');
      return;
    }
    
    // Prevent infinite loops - max 3 attempts per address
    if (fetchAttempts >= 3 && address === lastFetchAddress) {
      console.log('🚫 Max fetch attempts reached for address:', address);
      return;
    }
    
    setIsFetchingTokens(true);
    setFetchAttempts(prev => address === lastFetchAddress ? prev + 1 : 1);
    setLastFetchAddress(address);
    
    try {
      // Use microservice to avoid CORS issues
      const network = chain?.id === 1 ? 'eth-mainnet' : 
                      chain?.id === 137 ? 'polygon-mainnet' : 
                      chain?.id === 42161 ? 'arb-mainnet' : 
                      chain?.id === 10 ? 'opt-mainnet' : 
                      'eth-mainnet';
      
      // Get token balances via microservice
      const response = await fetch(`http://localhost:3001/api/alchemy/token-balances`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          address: address,
          network: network
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Alchemy response:', data);
        
        // Handle both microservice wrapper format and direct Alchemy format
        const tokenBalances = data.result?.tokenBalances || data.data?.tokenBalances || data.tokenBalances;
        
        if (tokenBalances) {
          console.log(`📊 Found ${tokenBalances.length} tokens from Alchemy`);
          
          // Filter out zero balances
          const nonZeroTokens = tokenBalances.filter(
            token => token.tokenBalance !== '0x0' && 
                    token.tokenBalance !== '0x00' && 
                    token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          );
          
          console.log(`📊 Found ${nonZeroTokens.length} tokens with balance`);
          
          // Fetch metadata for each token
          const tokenPromises = nonZeroTokens.slice(0, 10).map(async (token) => {
            try {
              const metadataResponse = await fetch(
                `http://localhost:3001/api/alchemy/token-metadata`,
                {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN}`,
                    'Origin': window.location.origin
                  },
                  body: JSON.stringify({
                    contractAddress: token.contractAddress,
                    network: network
                  })
                }
              );
              
              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json();
                // Handle both microservice wrapper format and direct Alchemy format
                const metadata = metadataData.result || metadataData.data || metadataData;
                const balance = parseInt(token.tokenBalance, 16);
                const decimals = metadata?.decimals || 18;
                const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(6);
                
                return {
                  symbol: metadata?.symbol || 'Unknown',
                  name: metadata?.name || 'Unknown Token',
                  balance: formattedBalance,
                  decimals: decimals,
                  contractAddress: token.contractAddress,
                  logo: metadata?.logo
                };
              }
            } catch (err) {
              console.error('Error fetching token metadata:', err);
            }
            return null;
          });
          
          const formattedTokens = (await Promise.all(tokenPromises)).filter(t => t !== null);
          console.log(`📊 Showing ${formattedTokens.length} tokens:`, formattedTokens.map(t => `${t.symbol}: ${t.balance}`));
          console.log(`📊 All token details:`, formattedTokens);
          setTokenBalances(formattedTokens);
          
          console.log('📊 ✅ Token balances set, will now fetch prices...');
          
          // Fetch PEPE price if we have tokens
          if (formattedTokens.length > 0) {
            fetchTokenPrices(formattedTokens);
            
            // Update AI context with portfolio data
            const portfolioContext = {
              connected: true,
              address: address,
              chain: chain?.name || 'Unknown',
              tokens: formattedTokens.map(t => ({
                symbol: t.symbol,
                name: t.name,
                balance: t.balance,
                contractAddress: t.contractAddress
              })),
              summary: `Wallet contains: ${formattedTokens.map(t => `${t.balance} ${t.symbol}`).join(', ')}`
            };
            
            updateAIContext(portfolioContext);
            console.log('🧠 Updated AI context with portfolio data:', portfolioContext);
            console.log('🧠 Window context data:', window.contextAwarenessData);
          }
        }
      } else {
        console.error('❌ Failed to fetch tokens:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
      // On error, wait before allowing retry
      setTimeout(() => {
        setIsFetchingTokens(false);
      }, 5000); // 5 second delay before retry
      return;
    } finally {
      setIsFetchingTokens(false);
    }
    }, [address, chain, isExpanded, isFetchingTokens, tokenBalances.length, fetchAttempts, lastFetchAddress]);
  
  // Auto-fetch token balances when wallet connects - DISABLED to prevent rate limiting
  // useEffect(() => {
  //   if (isConnected && address && !isFetchingTokens && fetchAttempts < 3) {
  //     fetchTokenBalances();
  //   }
  // }, [isConnected, address, fetchTokenBalances, isFetchingTokens, fetchAttempts]);



  // Fetch token prices when token balances are updated
  useEffect(() => {
    if (tokenBalances.length > 0) {
      fetchTokenPrices(tokenBalances);
    }
  }, [tokenBalances, fetchTokenPrices]);
  
  useEffect(() => {
    if (nativeBalance && !balanceLoading) {
      // Format the balance data
      const formatted = {
        native: {
          symbol: nativeBalance.symbol,
          balance: formatUnits(nativeBalance.value, nativeBalance.decimals),
          decimals: nativeBalance.decimals,
          formatted: nativeBalance.formatted
        },
        chain: chain?.name || 'Unknown',
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected',
        fullAddress: address
      };
      setPortfolioData(formatted);
      
      // Fetch ERC-20 token balances (only when expanded to prevent rate limiting)
      if (isExpanded && tokenBalances.length === 0 && fetchAttempts < 3 && !isFetchingTokens) {
        console.log('🔄 Fetching tokens because bubble is expanded');
        fetchTokenBalances();
      }
      
      // Update AI context with wallet data
      if (isExpanded && isConnected) {
        const allTokens = [
          `${formatted.native.formatted} ${formatted.native.symbol}`,
          ...tokenBalances.map(t => `${t.balance} ${t.symbol}`)
        ];
        
        const portfolioContext = {
          connected: true,
          address: formatted.address,
          fullAddress: address,
          chain: formatted.chain,
          balance: `${formatted.native.formatted} ${formatted.native.symbol}`,
          nativeToken: formatted.native.symbol,
          nativeBalance: formatted.native.formatted,
          tokens: tokenBalances,
          allBalances: allTokens.join(', '),
          summary: `Wallet contains: ${allTokens.join(', ')}`
        };
        
        updateAIContext(portfolioContext);
        
        console.log('🧠 Updated AI context with portfolio data:', portfolioContext);
        console.log('🧠 Window context data:', window.contextAwarenessData);
      }
    }
  }, [nativeBalance, balanceLoading, address, chain, isExpanded, isConnected, updateAIContext, tokenBalances]);

  // Initialize position
  useEffect(() => {
    if (!hasInitialized && isOpen) {
      const initialX = 100 + Math.random() * 100;
      const initialY = 100 + Math.random() * 100;
      setPosition({ x: initialX, y: initialY });
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized]);

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    // Use same dynamic sizing logic
    let bubbleSize = 128;
    if (isExpanded && typeof content === 'string') {
      const lines = content.split('\n').length;
      const avgLineLength = content.length / lines;
      const estimatedWidth = Math.max(250, Math.min(450, avgLineLength * 8 + 100));
      const estimatedHeight = Math.max(200, lines * 20 + 80);
      bubbleSize = Math.max(estimatedWidth, estimatedHeight);
    } else if (isExpanded) {
      bubbleSize = 300;
    }
    const bubbleCenter = {
      x: position.x + bubbleSize / 2, // Actual bubble center
      y: position.y + bubbleSize / 2  // Actual bubble center
    };

    const newParticles = [];
    for (let i = 0; i < 8; i++) { // Reduced from 25 to 8 particles
      const angle = (Math.PI * 2 * i) / 8;
      const speed = Math.random() * 8 + 3; // Faster initial speed
      const drift = (Math.random() - 0.5) * 0.5; // Random drift
      newParticles.push({
        id: Math.random(),
        x: bubbleCenter.x + (Math.random() - 0.5) * 20, // Slight random spread from center
        y: bubbleCenter.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + drift,
        vy: Math.sin(angle) * speed - Math.random() * 3, // More varied upward velocity
        size: Math.random() * 2 + 1.5, // Same as background particles: 1.5-3.5px
      });
    }
    
    // Add particles to main swarm
    addParticlesToSwarm(newParticles);
    
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    // Check for double-click to pop
    const currentTime = Date.now();
    console.log('🔴 WalletConnect click:', { currentTime, lastClickTime, diff: currentTime - lastClickTime });
    
    if (currentTime - lastClickTime < 200) { // Reduced from 300ms to 200ms for better sensitivity
      console.log('🔴 Double-click detected! Creating pop effect...');
      createPopEffect();
      return;
    }
    setLastClickTime(currentTime);
    
    // Toggle expanded state
    setIsExpanded(prev => !prev);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      setPosition({ x: newX, y: newY });
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Bubble will resume upward floating automatically
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Floating animation
  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        // Use same dynamic sizing as outside
        let bubbleSize = 128;
        if (isExpanded && typeof content === 'string') {
          const lines = content.split('\n').length;
          const avgLineLength = content.length / lines;
          const estimatedWidth = Math.max(250, Math.min(450, avgLineLength * 8 + 100));
          const estimatedHeight = Math.max(200, lines * 20 + 80);
          bubbleSize = Math.max(estimatedWidth, estimatedHeight);
        } else if (isExpanded) {
          bubbleSize = 300;
        }
        const margin = 20;
        
        // Simple upward floating - no hard stops
        let newY = prev.y;
        let newX = prev.x;
        
        // Always try to float up (like a balloon)
        const floatForce = -1.0; // Faster upward force (2x speed)
        newY += floatForce;
        
        // Stop at top of screen naturally
        if (newY < margin) {
          newY = margin;
        }
        
        // Keep X within screen bounds
        const maxX = window.innerWidth - bubbleSize - margin;
        const minX = margin;
        newX = Math.max(minX, Math.min(maxX, newX));
        
        // Gentle collision avoidance
        const allBubbles = Array.from(document.querySelectorAll('[data-bubble]'));
        const otherBubbles = allBubbles.filter(b => b.getAttribute('data-bubble-id') !== bubbleId);
        
        otherBubbles.forEach(otherBubble => {
          const otherRect = otherBubble.getBoundingClientRect();
          const otherCenterX = otherRect.left + otherRect.width / 2;
          const otherCenterY = otherRect.top + otherRect.height / 2;
          const thisCenterX = newX + bubbleSize / 2;
          const thisCenterY = newY + bubbleSize / 2;
          
          const distance = Math.sqrt(
            Math.pow(thisCenterX - otherCenterX, 2) + 
            Math.pow(thisCenterY - otherCenterY, 2)
          );
          
          const minDistance = bubbleSize + 10;
          
          // Gentle collision avoidance - small pushes
          if (distance < minDistance && distance > 0) {
            const angle = Math.atan2(thisCenterY - otherCenterY, thisCenterX - otherCenterX);
            const overlap = minDistance - distance;
            
            // Very gentle push - small incremental movements
            const pushForce = overlap * 0.02; // Much smaller force
            newX += Math.cos(angle) * pushForce;
            newY += Math.sin(angle) * pushForce;
          }
        });
        
        // SOLID BOUNDARIES - Absolutely prevent going off-screen
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(margin, newY); // Can't go above top
        newY = Math.min(window.innerHeight - bubbleSize - margin, newY); // Can't go below bottom
        
        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded, bubbleId]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  if (!isOpen) return null;

  // Dynamic bubble size
  let bubbleSize = 140;
  if (isExpanded) {
    bubbleSize = 400; // Increased size for better layout
  }
  
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      ref={bubbleRef}
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483647,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 0.1s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="portfolio"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-purple-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.15)'}}>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-purple-300/60 animate-pulse" style={{boxShadow: '0 0 25px #a855f7, 0 0 50px rgba(168, 85, 247, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/5 via-transparent to-purple-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-purple-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading || balanceLoading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <Wallet className="w-10 h-10 text-purple-400 mb-2" />
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-purple-400">Loading Portfolio...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Icon and title
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full border-4 border-purple-400 shadow-2xl shadow-purple-500/60 bg-gradient-to-br from-purple-400/30 to-purple-600/40 hover:border-purple-300 transition-all duration-300 hover:shadow-purple-400/80 hover:scale-105 group overflow-hidden">
                      <img 
                        src={walletConnectLogo} 
                        alt="WalletConnect" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs font-bold text-purple-300 drop-shadow-xl">WalletConnect</div>
                  </div>
                </div>
              ) : (
                // Expanded: Portfolio content
                <div className="w-full h-full flex flex-col">
                  {/* Header section with logo and title */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-purple-400 shadow-2xl shadow-purple-500/60 bg-gradient-to-br from-purple-400/30 to-purple-600/40 mx-auto mb-2">
                      <img 
                        src={walletConnectLogo} 
                        alt="WalletConnect" 
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                    </div>
                    <div className="text-sm font-bold text-purple-300 drop-shadow-lg">WalletConnect</div>
                    <div className="text-xs text-white/70 font-medium">Wallet Holdings</div>
                  </div>
                  
                  {/* Central content area */}
                  <div className="flex-1 px-6 py-4">
                    <div className="text-center space-y-3">
                      {!isConnected ? (
                        <div className="text-sm text-white/90 leading-relaxed">
                          <p className="text-purple-300 mb-2">No Wallet Connected</p>
                          <p className="text-xs text-white/60">Connect your wallet to view portfolio</p>
                        </div>
                      ) : portfolioData ? (
                        <div className="text-sm text-white/90 leading-relaxed space-y-2">
                          <div className="text-xs text-purple-300 mb-3">
                            {portfolioData.address}
                          </div>
                          

                          
                          {/* Simple Token Display */}
                          <div className="mt-4 text-sm text-white space-y-2">
                            {tokenBalances.length > 0 ? (
                              tokenBalances.map((token, index) => {
                                const price = tokenPrices[token.symbol];
                                const usdValue = price ? (parseFloat(token.balance) * price).toFixed(2) : null;
                                
                                return (
                                  <div key={index}>
                                    <span className="text-gray-400">{token.symbol}:</span> {token.balance}
                                    {usdValue ? (
                                      <div className="text-xs text-green-400 mt-1">
                                        ≈ ${usdValue} USD
                                      </div>
                                    ) : (
                                      <div className="text-xs text-yellow-400 mt-1">Loading price...</div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-gray-500">Loading...</div>
                            )}
                          </div>
                          
                          {/* Debug info */}
                          <div className="mt-2 text-xs text-gray-600">
                            Prices: {Object.keys(tokenPrices).length} | Tokens: {tokenBalances.length}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-white/90 leading-relaxed">
                          <p className="text-purple-300">Loading balance...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(bubble, document.body);
};

FloatingPortfolioBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingPortfolioBubble;
