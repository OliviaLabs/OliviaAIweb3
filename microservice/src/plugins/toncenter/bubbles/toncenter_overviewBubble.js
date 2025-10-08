export function toncenter_overviewBubble(data) {
  const info = data || {};
  return {
    title: 'TONCenter Overview',
    type: 'ton_overview',
    item: {
      latestBlock: info.latestBlock || info.seqno,
      network: info.network || 'ton'
    },
    timestamp: new Date().toISOString()
  };
}


