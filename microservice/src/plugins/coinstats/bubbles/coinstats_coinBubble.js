export function coinstats_coinBubble(data) {
  const c = data || {};
  return {
    title: `${(c.symbol || '').toUpperCase()} Details`,
    type: 'coinstats_coin',
    item: {
      id: c.id,
      symbol: (c.symbol || '').toUpperCase(),
      name: c.name,
      price: c.price || c.current_price,
      marketCap: c.marketCap || c.market_cap,
      volume24h: c.volume24h || c.total_volume,
      change24h: c.priceChange24h || c.price_change_percentage_24h || 0
    },
    timestamp: new Date().toISOString()
  };
}

export function formatCoinstatsCoinBubble(data) {
  return {
    title: 'CoinStats Coin Details',
    type: 'market',
    metrics: data?.coin ? 1 : 0,
    items: data?.coin ? [data.coin] : [],
    timestamp: new Date().toISOString()
  };
}


