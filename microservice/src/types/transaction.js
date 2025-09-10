/**
 * Shared transaction envelope type for frontend/backend contract
 * All numeric values must be 0x-prefixed hex strings for MetaMask
 */

/**
 * @typedef {Object} TxEnvelope
 * @property {string} from - Sender address (0x-prefixed)
 * @property {string} to - Contract address (0x-prefixed)
 * @property {string} data - Transaction calldata (0x-prefixed)
 * @property {string} [value='0x0'] - ETH value in wei (0x-prefixed hex)
 * @property {string} [gas] - Gas limit (0x-prefixed hex)
 * @property {string} [gasPrice] - Gas price in wei (0x-prefixed hex)
 * @property {number} [chainId] - Chain ID (optional for MetaMask)
 */

/**
 * Convert decimal string or number to 0x-prefixed hex string
 * @param {string|number|bigint} value - Value to convert
 * @returns {string} 0x-prefixed hex string
 */
export function toHex(value) {
  if (value === undefined || value === null) {
    return '0x0';
  }
  
  // Already hex
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value;
  }
  
  // Convert to BigInt then to hex
  try {
    const bn = BigInt(value);
    return '0x' + bn.toString(16);
  } catch (error) {
    console.error('Failed to convert to hex:', value, error);
    return '0x0';
  }
}

/**
 * Create a properly formatted transaction envelope for MetaMask
 * @param {Object} params
 * @param {string} params.from - Sender address
 * @param {string} params.to - Contract address
 * @param {string} params.data - Transaction calldata
 * @param {string|number} [params.value] - ETH value in wei
 * @param {string|number} [params.gas] - Gas limit
 * @param {string|number} [params.gasPrice] - Gas price in wei
 * @param {number} [params.chainId] - Chain ID
 * @returns {TxEnvelope} Properly formatted transaction envelope
 */
export function createTxEnvelope(params) {
  const envelope = {
    from: String(params.from),
    to: String(params.to),
    data: String(params.data),
  };
  
  // Add optional fields with hex conversion
  if (params.value !== undefined) {
    envelope.value = toHex(params.value);
  }
  
  if (params.gas !== undefined) {
    envelope.gas = toHex(params.gas);
  }
  
  if (params.gasPrice !== undefined) {
    envelope.gasPrice = toHex(params.gasPrice);
  }
  
  if (params.chainId !== undefined) {
    envelope.chainId = Number(params.chainId);
  }
  
  return envelope;
}

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
    return false;
  }
  
  // Check that addresses and data are properly formatted
  if (!tx.from.startsWith('0x') || !tx.to.startsWith('0x') || !tx.data.startsWith('0x')) {
    return false;
  }
  
  // Check optional hex fields if present
  if (tx.value && !tx.value.startsWith('0x')) {
    return false;
  }
  
  if (tx.gas && !tx.gas.startsWith('0x')) {
    return false;
  }
  
  if (tx.gasPrice && !tx.gasPrice.startsWith('0x')) {
    return false;
  }
  
  return true;
}
