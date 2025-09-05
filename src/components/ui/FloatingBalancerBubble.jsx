import React, { useState, useEffect } from 'react';
import { balancerService } from '../../api/services/balancer.service.js';

const FloatingBalancerBubble = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  loading, 
  addParticlesToSwarm,
  position = { x: 500, y: 200 }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [poolData, setPoolData] = useState(null);
  const [weightedPools, setWeightedPools] = useState(null);
  const [stablePools, setStablePools] = useState(null);
  const [balToken, setBalToken] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && !poolData) {
      loadBalancerData();
    }
  }, [isOpen]);

  const loadBalancerData = async () => {
    try {
      const [pools, weighted, stable, token] = await Promise.all([
        balancerService.getPools(10),
        balancerService.getWeightedPools(),
        balancerService.getStablePools(),
        balancerService.getBALTokenPrice()
      ]);
      
      setPoolData(pools);
      setWeightedPools(weighted);
      setStablePools(stable);
      setBalToken(token);
    } catch (error) {
      console.error('Balancer data load error:', error);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 200;
    
    position.x = Math.max(0, Math.min(newX, maxX));
    position.y = Math.max(0, Math.min(newY, maxY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  if (!isOpen) return null;

  const formatVolume = (volume) => {
    if (!volume) return 'N/A';
    const vol = parseFloat(volume);
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    const p = parseFloat(price);
    if (p >= 1000) return `$${p.toFixed(0)}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(6)}`;
  };

  const formatWeight = (weight) => {
    if (!weight) return 'N/A';
    return `${(parseFloat(weight) * 100).toFixed(1)}%`;
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded ? 'w-96 h-96' : 'w-64 h-48'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isExpanded ? 'scale(1.1)' : 'scale(1)',
        boxShadow: '0 10px 30px rgba(255, 0, 255, 0.3)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-black border-2 border-purple-300 rounded-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-purple-900 bg-opacity-50 p-3 flex justify-between items-center">
          <h3 className="text-purple-300 font-bold text-sm flex items-center">
            ⚖️ {title || 'Balancer - Base'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-300 hover:text-purple-100 text-xs px-2 py-1 rounded border border-purple-300"
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-200 text-xs px-2 py-1 rounded border border-red-400"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          {loading ? (
            <div className="text-purple-300 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-purple-300 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading Balancer data...
            </div>
          ) : (
            <div className="space-y-3">
              {/* BAL Token */}
              {balToken && (
                <div className="text-center p-2 bg-purple-900 bg-opacity-30 rounded">
                  <div className="text-purple-300 font-bold">
                    BAL: {formatPrice(balToken.totalValueLockedUSD)}
                  </div>
                </div>
              )}

              {/* Top Pools */}
              {poolData && poolData.length > 0 && (
                <div>
                  <div className="text-purple-300 font-semibold text-xs mb-2">
                    Top Pools
                  </div>
                  <div className="space-y-2">
                    {poolData.slice(0, isExpanded ? 5 : 3).map((pool, index) => (
                      <div key={pool.id || index} className="text-xs bg-purple-900 bg-opacity-20 p-2 rounded">
                        <div className="text-purple-300 font-medium">
                          {pool.name || pool.symbol}
                        </div>
                        <div className="text-purple-400">
                          TVL: {formatVolume(pool.totalLiquidity)}
                        </div>
                        <div className="text-purple-400">
                          Vol: {formatVolume(pool.totalSwapVolume)}
                        </div>
                        {isExpanded && pool.tokens && (
                          <div className="text-purple-400">
                            Tokens: {pool.tokens.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weighted Pools */}
              {weightedPools && weightedPools.length > 0 && isExpanded && (
                <div>
                  <div className="text-purple-300 font-semibold text-xs mb-2">
                    Weighted Pools
                  </div>
                  <div className="space-y-1">
                    {weightedPools.slice(0, 3).map((pool, index) => (
                      <div key={pool.id || index} className="text-xs bg-purple-900 bg-opacity-20 p-2 rounded">
                        <div className="text-purple-300 font-medium">
                          {pool.name || pool.symbol}
                        </div>
                        <div className="text-purple-400">
                          TVL: {formatVolume(pool.totalLiquidity)}
                        </div>
                        {pool.tokens && pool.tokens[0] && (
                          <div className="text-purple-400">
                            {pool.tokens[0].symbol}: {formatWeight(pool.tokens[0].weight)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stable Pools */}
              {stablePools && stablePools.length > 0 && isExpanded && (
                <div>
                  <div className="text-purple-300 font-semibold text-xs mb-2">
                    Stable Pools
                  </div>
                  <div className="space-y-1">
                    {stablePools.slice(0, 2).map((pool, index) => (
                      <div key={pool.id || index} className="text-xs bg-purple-900 bg-opacity-20 p-2 rounded">
                        <div className="text-purple-300 font-medium">
                          {pool.name || pool.symbol}
                        </div>
                        <div className="text-purple-400">
                          TVL: {formatVolume(pool.totalLiquidity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => window.open('https://app.balancer.fi/#/base', '_blank')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Trade on Balancer
                </button>
                {isExpanded && (
                  <button
                    onClick={() => window.open('https://app.balancer.fi/#/base/pools', '_blank')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                  >
                    View Pools
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingBalancerBubble;
