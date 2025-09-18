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
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [hasInitialized, setHasInitialized] = useState(false);
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
    if (window.contextAwarenessData) {
      window.contextAwarenessData = {
        ...window.contextAwarenessData,
        portfolio_data: {
          wallet: {
            data: data,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }, []);
  
  // Track if we're already fetching to prevent duplicate calls
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);
  const [pepePrice, setPepePrice] = useState(null);
  
  // Fetch PEPE price from CoinGecko
  const fetchPepePrice = useCallback(async () => {
    try {
      // Use centralized CoinGecko service
      const { coingeckoService } = await import('../../api');
      const data = await coingeckoService.getPrices(['pepe']);
      setPepePrice(data.pepe?.usd);
    } catch (error) {
      console.error('Error fetching PEPE price:', error);
    }
  }, []);
  
  // Fetch token balances from Alchemy via microservice
  const fetchTokenBalances = useCallback(async () => {
    if (!address || isFetchingTokens || tokenBalances.length > 0) return;
    
    setIsFetchingTokens(true);
    
    try {
      // Call Alchemy directly to avoid microservice rate limits
      const network = chain?.id === 1 ? 'eth-mainnet' : 
                      chain?.id === 137 ? 'polygon-mainnet' : 
                      chain?.id === 42161 ? 'arb-mainnet' : 
                      chain?.id === 10 ? 'opt-mainnet' : 
                      'eth-mainnet';
      
      const alchemyApiKey = '_pGB49JjZobNT7IahUuqg'; // Your API key that works
      
      // Get token balances directly from Alchemy
      const response = await fetch(
        `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'alchemy_getTokenBalances',
            params: [address]
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Alchemy response:', data);
        if (data.result?.tokenBalances) {
          console.log(`📊 Found ${data.result.tokenBalances.length} tokens from Alchemy`);
          
          // Filter out zero balances
          const nonZeroTokens = data.result.tokenBalances.filter(
            token => token.tokenBalance !== '0x0' && 
                    token.tokenBalance !== '0x00' && 
                    token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          );
          
          console.log(`📊 Found ${nonZeroTokens.length} tokens with balance`);
          
          // Fetch metadata for each token
          const tokenPromises = nonZeroTokens.slice(0, 10).map(async (token) => {
            try {
              const metadataResponse = await fetch(
                `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'alchemy_getTokenMetadata',
                    params: [token.contractAddress]
                  })
                }
              );
              
              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json();
                const metadata = metadataData.result;
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
          
          // Fetch PEPE price if we have tokens
          if (formattedTokens.length > 0) {
            fetchPepePrice();
            
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
    } finally {
      setIsFetchingTokens(false);
    }
    }, [address, chain, isExpanded, isFetchingTokens, tokenBalances.length]);
  
  // Fetch tokens automatically when wallet connects
  useEffect(() => {
    if (isConnected && address && !tokenBalances.length && !isFetchingTokens) {
      console.log('🚀 Auto-fetching tokens for connected wallet');
      fetchTokenBalances();
    }
  }, [isConnected, address, tokenBalances.length, isFetchingTokens]);
  
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
      
      // Fetch ERC-20 token balances
      fetchTokenBalances();
      
      // Update AI context with wallet data
      if (isExpanded && isConnected) {
        const allTokens = [
          `${formatted.native.formatted} ${formatted.native.symbol}`,
          ...tokenBalances.map(t => `${t.balance} ${t.symbol}`)
        ];
        
        updateAIContext({
          connected: true,
          address: formatted.address,
          fullAddress: address,
          chain: formatted.chain,
          balance: `${formatted.native.formatted} ${formatted.native.symbol}`,
          nativeToken: formatted.native.symbol,
          nativeBalance: formatted.native.formatted,
          tokens: tokenBalances,
          allBalances: allTokens.join(', ')
        });
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

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (isExpanded ? 350 : 140);
        const maxY = window.innerHeight - (isExpanded ? 350 : 140);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, isExpanded]);

  const handleClick = (e) => {
    if (e.target.closest('button')) return;
    if (!isDragging) {
      setIsExpanded(!isExpanded);
      if (addParticlesToSwarm && !isExpanded) {
        // Create particle effect on expansion
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create array of particles for the effect
        const particles = [];
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const velocity = 2 + Math.random() * 3;
          particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: 2 + Math.random() * 3,
            color: '#a855f7' // Purple color for portfolio
          });
        }
        addParticlesToSwarm(particles);
      }
    }
  };

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
  
  // Floating animation state
  const [floatOffset, setFloatOffset] = useState(0);
  
  // Floating swarm effect like other bubbles
  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        // Use same dynamic sizing as outside
        let bubbleSize = 140;
        if (isExpanded) {
          bubbleSize = 400;
        }
        const margin = 20;
        
        // Simple upward floating - no hard stops
        let newY = prev.y;
        let newX = prev.x;
        
        // Always try to float up (like a balloon)
        const floatForce = -1.0; // Faster upward force
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
            const pushForce = overlap * 0.02;
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
                          <div className="mt-4 text-sm text-white">
                            {tokenBalances.length > 0 ? (
                              <div>
                                <span className="text-gray-400">{tokenBalances[0].symbol}:</span> {tokenBalances[0].balance}
                                {pepePrice ? (
                                  <div className="text-xs text-green-400 mt-1">
                                    ≈ ${(parseFloat(tokenBalances[0].balance) * pepePrice).toFixed(2)} USD
                                  </div>
                                ) : (
                                  <div className="text-xs text-yellow-400 mt-1">Loading price...</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500">Loading...</div>
                            )}
                          </div>
                          
                          {/* Debug info */}
                          <div className="mt-2 text-xs text-gray-600">
                            Price: ${pepePrice || 'loading'} | Tokens: {tokenBalances.length}
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
