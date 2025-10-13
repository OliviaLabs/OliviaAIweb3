// Reusable card component for displaying live data in desktop sidebar
import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';

export function TokenPriceCard({ symbol, name, price, change24h, marketCap }) {
  const isPositive = change24h >= 0;
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/50 transition-all">
      {/* Token Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-white font-semibold text-sm">{symbol}</div>
          <div className="text-gray-400 text-xs truncate">{name}</div>
        </div>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>

      {/* Price */}
      <div className="mb-2">
        <div className="text-white text-lg font-bold">
          ${price?.toLocaleString() || 'N/A'}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs">
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <Activity className="w-3 h-3" />
          <span>{isPositive ? '+' : ''}{change24h?.toFixed(2)}%</span>
        </div>
        {marketCap && (
          <div className="text-gray-400 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            <span>${(marketCap / 1e9).toFixed(2)}B</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickStatCard({ icon: Icon, label, value, trend, color = 'green' }) {
  const colorClasses = {
    green: 'text-green-400 border-green-500/30 bg-green-500/10',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    orange: 'text-orange-400 border-orange-500/30 bg-orange-500/10'
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color] || colorClasses.green}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-white font-bold text-lg">{value}</div>
        {trend && (
          <div className={`text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );
}

export function NewsCard({ title, source, time, url }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/50 transition-all cursor-pointer">
      <div className="text-white text-sm font-medium mb-1 line-clamp-2">
        {title}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{source}</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

export function PluginActivityCard({ pluginName, action, tokenSymbol, timestamp }) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-2.5 border border-gray-700/30">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium mb-0.5">{pluginName}</div>
          <div className="text-gray-400 text-[11px] truncate">
            {action} {tokenSymbol && <span className="text-green-400">{tokenSymbol}</span>}
          </div>
        </div>
        <div className="text-gray-500 text-[10px] whitespace-nowrap ml-2">
          {timestamp}
        </div>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
    </div>
  );
}

