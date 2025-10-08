export function coinstats_marketsBubble(data) {
  const items = Array.isArray(data) ? data : [];
  return {
    title: 'CoinStats Markets',
    type: 'coinstats_markets',
    items: items.slice(0, 50).map(m => ({
      exchange: m.exchange || m.market || 'unknown',
      pair: m.pair || `${m.base}/${m.quote}`,
      price: m.price,
      volume24h: m.volume24h || m.volume,
    })),
    timestamp: new Date().toISOString()
  };
}

export function formatCoinstatsMarketsBubble(data) {
  return {
    title: 'CoinStats Markets',
    type: 'market',
    metrics: Array.isArray(data?.markets) ? data.markets.length : 0,
    items: data?.markets || [],
    timestamp: new Date().toISOString()
  };
}


