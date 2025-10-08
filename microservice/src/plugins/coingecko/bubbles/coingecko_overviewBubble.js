export function coingecko_overviewBubble(data) {
  const coins = Array.isArray(data?.coins) ? data.coins : Array.isArray(data) ? data : [];
  return {
    title: 'CoinGecko Overview',
    type: 'market_overview',
    count: coins.length,
    items: coins.slice(0, 50).map(c => ({
      symbol: (c.symbol || '').toUpperCase(),
      name: c.name,
      price: c.current_price || c.price,
      marketCap: c.market_cap || c.marketCap,
      change24h: c.price_change_percentage_24h || c.priceChange24h || 0,
    })),
    timestamp: new Date().toISOString()
  };
}


