export function coinstats_searchBubble(data) {
  const results = Array.isArray(data) ? data : (Array.isArray(data?.coins) ? data.coins : []);
  return {
    title: 'CoinStats Search',
    type: 'coinstats_search',
    items: results.slice(0, 50).map(c => ({
      id: c.id,
      symbol: (c.symbol || '').toUpperCase(),
      name: c.name,
    })),
    timestamp: new Date().toISOString()
  };
}

export function formatCoinstatsSearchBubble(data) {
  return {
    title: 'CoinStats Search',
    type: 'market',
    metrics: Array.isArray(data?.results) ? data.results.length : 0,
    items: data?.results || [],
    timestamp: new Date().toISOString()
  };
}


