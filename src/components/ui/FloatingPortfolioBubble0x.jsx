import React, { useState, useEffect, useRef } from 'react';
import { Wallet } from 'lucide-react';
import alchemyLogo from '../../assets/alchemy-logo.jpg';

export default function FloatingPortfolioBubble0x({ 
  isOpen, 
  onClose, 
  title = "Alchemy", 
  content = "Loading wallet data...", 
  loading = false,
  portfolioData = null,
  addParticlesToSwarm
}) {
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const bubbleRef = useRef(null);
  const bubbleId = useRef(`portfolio-${Date.now()}`).current;

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
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
            color: '#9333EA' // Purple color for Portfolio
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
      data-bubble="portfolio"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-purple-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #9333EA, inset 0 0 20px rgba(147, 51, 234, 0.15)'}}>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-purple-300/60 animate-pulse" style={{boxShadow: '0 0 25px #9333EA, 0 0 50px rgba(147, 51, 234, 0.3)'}}></div>
        
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
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <img src={alchemyLogo} alt="Alchemy" className="w-10 h-10 rounded-full mb-2" />
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-purple-400">Loading Balance...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Icon and title
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full border-4 border-purple-400 shadow-2xl shadow-purple-500/60 bg-gradient-to-br from-purple-400/30 to-purple-600/40 hover:border-purple-300 transition-all duration-300 hover:shadow-purple-400/80 hover:scale-105 group overflow-hidden flex items-center justify-center">
                      <img src={alchemyLogo} alt="Alchemy" className="w-5 h-5 rounded-full group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs font-bold text-purple-300 drop-shadow-xl">Portfolio</div>
                  </div>
                </div>
              ) : (
                // Expanded: Portfolio data
                <div className="w-full h-full flex flex-col">
                  {/* Header section with logo and title */}
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-400 shadow-2xl shadow-purple-500/60 bg-gradient-to-br from-purple-400/30 to-purple-600/40 mx-auto mb-2 flex items-center justify-center">
                      <img src={alchemyLogo} alt="Alchemy" className="w-6 h-6 rounded-full" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                    </div>
                    <div className="text-sm font-bold text-purple-300 drop-shadow-lg">Alchemy Portfolio</div>
                    <div className="text-xs text-white/70 font-medium">Multi-Chain Scanner</div>
                  </div>
                  
                  {/* Central content area */}
                  <div className="flex-1 overflow-y-auto px-2">
                    {portfolioData ? (
                      <div className="space-y-2">
                        {/* Wallet Info */}
                        <div className="text-center mb-3">
                          <div className="text-xs text-purple-300 font-medium">
                            {portfolioData.address ? 
                              `${portfolioData.address.slice(0, 6)}...${portfolioData.address.slice(-4)}` : 
                              'Not connected'
                            }
                          </div>
                          <div className="text-xs text-white/60">
                            {portfolioData.chainId === 1 ? 'Ethereum' : 
                             portfolioData.chainId === 8453 ? 'Base' : 
                             `Chain ${portfolioData.chainId}`}
                          </div>
                        </div>

                        {/* Balance Data */}
                        {portfolioData.fallback ? (
                          <div className="text-center">
                            <div className="text-xs text-green-400 mb-2">✅ Connected</div>
                            <div className="text-xs text-white/70">
                              Use WalletConnect for detailed portfolio
                            </div>
                          </div>
                        ) : portfolioData.balances?.length > 0 ? (
                          <div className="space-y-1">
                            {portfolioData.balances.slice(0, 3).map((token, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-white font-medium">{token.symbol || 'Token'}</span>
                                  <span className="text-purple-300">{token.balance || '0'}</span>
                                </div>
                                {token.valueUSD && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/60">${token.priceUSD}</span>
                                    <span className="text-green-400 font-medium">${token.valueUSD}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {portfolioData.balances.length > 3 && (
                              <div className="text-center text-xs text-white/50">
                                +{portfolioData.balances.length - 3} more
                              </div>
                            )}
                            
                            {/* Total Portfolio Value */}
                            {portfolioData.balances.some(t => t.valueUSD) && (
                              <div className="border-t border-purple-500/30 pt-2 mt-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-purple-300 font-medium">Total Value:</span>
                                  <span className="text-green-400 font-bold">
                                    ${portfolioData.balances
                                      .filter(t => t.valueUSD)
                                      .reduce((sum, t) => sum + parseFloat(t.valueUSD), 0)
                                      .toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-white/60">
                            No tokens found
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-white/70">
                        {content}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return bubble;
}