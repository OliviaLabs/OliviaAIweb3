import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Coins, Database, Loader } from 'lucide-react';
import { useAccount } from 'wagmi';
import alchemyLogo from '../../assets/alchemy-logo.jpg';
import { getTokensForChain } from '../../utils/chainDetection';

const FloatingAlchemyBubble = ({ 
  isOpen, 
  onClose, 
  title = "Alchemy", 
  content = "", 
  loading = false,
  addParticlesToSwarm 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [tokenBalances, setTokenBalances] = useState(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const bubbleRef = useRef(null);
  const bubbleId = useRef(`alchemy-${Date.now()}`).current;
  
  // Wallet connection
  const { address, isConnected, chain, connector, chainId } = useAccount();
  
  // Fetch token balances using simple Alchemy call
  const fetchTokenBalances = useCallback(async () => {
    if (!address || !isConnected || !chain?.id) return;
    
    setIsLoadingTokens(true);
    try {
      console.log(`🔮 Fetching tokens for wallet ${address} on ${chain.name}`);
      
      // Simple Alchemy call for current chain only
      const alchemyApiKey = '_pGB49JjZobNT7IahUuqg';
      console.log(`🔮 Current chain:`, chain);
      console.log(`🔮 Chain ID:`, chain?.id || chainId);
      
      const currentChainId = chain?.id || chainId;
      const network = currentChainId === 1 ? 'eth-mainnet' : 
                      currentChainId === 8453 ? 'base-mainnet' : 
                      currentChainId === 137 ? 'polygon-mainnet' : 
                      currentChainId === 10 ? 'opt-mainnet' : 
                      currentChainId === 42161 ? 'arb-mainnet' : 
                      'eth-mainnet';
      
      console.log(`🔮 Using Alchemy network:`, network);
      
      const response = await fetch(
        `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        if (data.result?.tokenBalances) {
          const nonZeroTokens = data.result.tokenBalances.filter(
            token => token.tokenBalance !== '0x0' && 
                    token.tokenBalance !== '0x00' && 
                    token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          );
          
          // Get metadata for each token
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
          
          const tokens = (await Promise.all(tokenPromises)).filter(t => t !== null);
          console.log(`🔮 Found ${tokens.length} tokens:`, tokens);
          setTokenBalances(tokens);
          updateAIContext(tokens);
        }
      }
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [address, isConnected, chain]);
  
  // Update global context for AI
  const updateAIContext = useCallback((data) => {
    if (window.contextAwarenessData) {
      window.contextAwarenessData = {
        ...window.contextAwarenessData,
        portfolio_data: {
          ...window.contextAwarenessData.portfolio_data,
          alchemy_tokens: {
            data: data,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }, []);
  
  // Fetch tokens when expanded
  useEffect(() => {
    if (isExpanded && isConnected && !tokenBalances && !isLoadingTokens) {
      fetchTokenBalances();
    }
  }, [isExpanded, isConnected, fetchTokenBalances, tokenBalances, isLoadingTokens]);

  // Initialize position
  useEffect(() => {
    if (!hasInitialized && isOpen) {
      const initialX = 150 + Math.random() * 100;
      const initialY = 150 + Math.random() * 100;
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
            color: '#4169E1' // Blue color for Alchemy
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
    bubbleSize = 350;
  }
  
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  // Format token display
  const formatTokenBalance = (balance, decimals = 18) => {
    if (!balance || balance === '0x0') return '0';
    const value = parseInt(balance, 16) / Math.pow(10, decimals);
    if (value < 0.0001) return '<0.0001';
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    return value.toFixed(0);
  };
  
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
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="alchemy"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-blue-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4169E1, inset 0 0 20px rgba(65, 105, 225, 0.15)'}}>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-blue-300/60 animate-pulse" style={{boxShadow: '0 0 25px #4169E1, 0 0 50px rgba(65, 105, 225, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-500/5 via-transparent to-blue-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-blue-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading || isLoadingTokens ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <Database className="w-10 h-10 text-blue-400 mb-2" />
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-blue-400">Fetching Tokens...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Icon and title
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-400 shadow-2xl shadow-blue-500/60 bg-gradient-to-br from-blue-400/30 to-blue-600/40 hover:border-blue-300 transition-all duration-300 hover:shadow-blue-400/80 hover:scale-105 group overflow-hidden">
                      <img 
                        src={alchemyLogo} 
                        alt="Alchemy" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs font-bold text-blue-300 drop-shadow-xl">Alchemy</div>
                  </div>
                </div>
              ) : (
                // Expanded: Token balances
                <div className="w-full h-full flex flex-col">
                  {/* Header section with logo and title */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-blue-400 shadow-2xl shadow-blue-500/60 bg-gradient-to-br from-blue-400/30 to-blue-600/40 mx-auto mb-2">
                      <img 
                        src={alchemyLogo} 
                        alt="Alchemy" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20"></div>
                    </div>
                    <div className="text-sm font-bold text-blue-300 drop-shadow-lg">Token Balances</div>
                    <div className="text-xs text-white/70 font-medium">Powered by Alchemy</div>
                  </div>
                  
                  {/* Central content area */}
                  <div className="flex-1 px-6 py-4 overflow-y-auto">
                    <div className="text-center space-y-3">
                      {!isConnected ? (
                        <div className="text-sm text-white/90 leading-relaxed">
                          <p className="text-blue-300 mb-2">No Wallet Connected</p>
                          <p className="text-xs text-white/60">Connect your wallet to view tokens</p>
                        </div>
                      ) : tokenBalances ? (
                        <div className="text-sm text-white/90 leading-relaxed space-y-2">
                          <div className="text-xs text-blue-300 mb-3">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                          </div>
                          
                          {tokenBalances.tokenBalances && tokenBalances.tokenBalances.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {tokenBalances.tokenBalances.filter(token => 
                                token.tokenBalance && token.tokenBalance !== '0x0'
                              ).map((token, index) => (
                                <div key={index} className="bg-black/30 rounded-lg p-2 border border-blue-400/30">
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/70 text-xs truncate">
                                      {token.symbol || `${token.contractAddress.slice(0, 6)}...`}
                                    </span>
                                    <span className="text-white font-bold text-xs">
                                      {formatTokenBalance(token.tokenBalance, token.decimals)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-white/50">
                              No tokens found in this wallet
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-white/90 leading-relaxed">
                          <p className="text-blue-300">Click to load tokens...</p>
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

FloatingAlchemyBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingAlchemyBubble;
