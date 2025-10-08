export function changenow_exchangeBubble(data) {
  const d = data || {};
  return {
    title: 'ChangeNOW Exchange',
    type: 'exchange_info',
    item: {
      from: d.fromCurrency?.ticker || d.fromCurrency || d.from,
      to: d.toCurrency?.ticker || d.toCurrency || d.to,
      minAmount: d.minAmount?.min || d.minAmount,
      estimatedAmount: d.exchangeAmount?.estimatedAmount || d.estimatedAmount,
      rate: d.exchangeRange?.rate || d.rate
    },
    timestamp: new Date().toISOString()
  };
}


