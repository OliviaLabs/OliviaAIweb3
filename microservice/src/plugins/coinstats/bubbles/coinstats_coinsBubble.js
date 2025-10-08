export function coinstats_coinsBubble(data) {
  const coins = Array.isArray(data) ? data : (Array.isArray(data?.coins) ? data.coins : []);
  return {
    title: 'CoinStats Coins',
    type: 'coinstats_list',
    items: coins.slice(0, 50).map(c => ({
      id: c.id || c.coinId,
      symbol: (c.symbol || '').toUpperCase(),
      name: c.name,
      price: c.price || c.current_price,
      rank: c.rank || c.market_cap_rank,
    })),
    timestamp: new Date().toISOString()
  };
}

export function formatCoinstatsCoinsBubble(data) {
  return {
    title: 'CoinStats Coins',
    type: 'market',
    metrics: Array.isArray(data?.coins) ? data.coins.length : 0,
    items: data?.coins || [],
    timestamp: new Date().toISOString()
  };
}


