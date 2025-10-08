export function chainbase_overviewBubble(data) {
  const d = data || {};
  return {
    title: 'Chainbase Overview',
    type: 'onchain_overview',
    item: {
      chains: d.chains || d.networks || [],
      stats: d.stats || {}
    },
    timestamp: new Date().toISOString()
  };
}


