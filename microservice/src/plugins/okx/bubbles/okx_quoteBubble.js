export function okx_quoteBubble(data) {
  const q = data?.quote || data || {};
  return {
    title: 'OKX DEX Quote',
    type: 'dex_quote',
    item: {
      fromToken: q.fromToken || data?.fromToken,
      toToken: q.toToken || data?.toToken,
      toAmount: q.toAmount || data?.toAmount,
      rate: q.rate || data?.rate,
      gasEstimate: q.gasEstimate || data?.gasEstimate
    },
    timestamp: new Date().toISOString()
  };
}


