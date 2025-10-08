export function zerox_quoteBubble(data) {
  const q = data?.data || data || {};
  return {
    title: '0x Quote',
    type: 'dex_quote',
    item: {
      price: q.price,
      guaranteedPrice: q.guaranteedPrice,
      to: q.to,
      data: q.data,
      value: q.value,
      gas: q.gas
    },
    timestamp: new Date().toISOString()
  };
}


