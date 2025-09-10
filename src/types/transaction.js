/**
 * Shared transaction envelope type for frontend/backend contract
 * All numeric values must be 0x-prefixed hex strings for MetaMask
 */

/**
 * Validate that a transaction envelope has all required fields
 * @param {any} tx - Transaction object to validate
 * @returns {boolean} True if valid
 */
export function isValidTxEnvelope(tx) {
  if (!tx || typeof tx !== 'object') {
    return false;
  }
  
  // Required fields
  if (!tx.from || !tx.to || !tx.data) {
    console.warn('Missing required transaction fields:', {
      hasFrom: !!tx.from,
      hasTo: !!tx.to,
      hasData: !!tx.data
    });
    return false;
  }
  
  // Check that addresses and data are properly formatted
  if (!tx.from.startsWith('0x') || !tx.to.startsWith('0x') || !tx.data.startsWith('0x')) {
    console.warn('Transaction fields not properly formatted:', {
      from: tx.from?.substring(0, 10),
      to: tx.to?.substring(0, 10),
      data: tx.data?.substring(0, 10)
    });
    return false;
  }
  
  // Check optional hex fields if present
  if (tx.value && !tx.value.startsWith('0x')) {
    console.warn('Value not hex formatted:', tx.value);
    return false;
  }
  
  if (tx.gas && !tx.gas.startsWith('0x')) {
    console.warn('Gas not hex formatted:', tx.gas);
    return false;
  }
  
  if (tx.gasPrice && !tx.gasPrice.startsWith('0x')) {
    console.warn('GasPrice not hex formatted:', tx.gasPrice);
    return false;
  }
  
  return true;
}

/**
 * Extract transaction envelope from various possible locations in payload
 * @param {any} payload - Response payload from backend
 * @returns {Object|null} Transaction envelope or null
 */
export function extractTxEnvelope(payload) {
  console.log('🔍 extractTxEnvelope called with payload:', {
    hasTxEnvelope: !!payload?.txEnvelope,
    hasTransaction: !!payload?.transaction,
    hasWalletTransactions: !!payload?.walletTransactions,
    hasTransactionData: !!payload?.transactionData,
    payloadKeys: Object.keys(payload || {})
  });
  
  // Check all possible locations where backend might put the transaction
  // The backend returns txEnvelope at the top level of the result
  const tx = 
    payload?.txEnvelope ??                        // Primary standardized location
    payload?.transaction ??                       // Alternative name
    payload?.walletTransactions?.[0]?.transactionData ?? // Legacy array format
    payload?.transactionData ??                   // Direct field
    null;
    
  if (!tx) {
    console.warn('No transaction envelope found in payload');
    return null;
  }
  
  if (!isValidTxEnvelope(tx)) {
    console.error('Invalid transaction envelope:', tx);
    return null;
  }
  
  console.log('✅ Valid transaction envelope found:', {
    from: tx.from,
    to: tx.to,
    dataLength: tx.data?.length,
    value: tx.value,
    gas: tx.gas
  });
  
  return tx;
}
