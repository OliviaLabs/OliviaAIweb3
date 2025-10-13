/**
 * Parameter Validation and Sanitization Guards
 * Validates and sanitizes API parameters before making calls
 */

/**
 * Validate token symbol (e.g., BTC, ETH, USDT)
 * @param {string} symbol - Token symbol
 * @returns {boolean} - True if valid
 */
export function isValidTokenSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }

  // Token symbols: 2-10 alphanumeric characters
  const symbolRegex = /^[A-Z0-9]{2,10}$/i;
  return symbolRegex.test(symbol);
}

/**
 * Validate Ethereum-style address
 * @param {string} address - Ethereum address
 * @returns {boolean} - True if valid format
 */
export function isValidEthAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Ethereum address: 0x followed by 40 hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

/**
 * Validate amount (must be positive number or numeric string)
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} - True if valid
 */
export function isValidAmount(amount) {
  if (amount === null || amount === undefined) {
    return false;
  }

  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Validate chain ID
 * @param {number|string} chainId - Chain ID
 * @returns {boolean} - True if valid
 */
export function isValidChainId(chainId) {
  const validChainIds = [1, 56, 137, 250, 8453, 42161, 43114, 10, 100]; // Common chains
  const id = parseInt(chainId);
  return !isNaN(id) && id > 0;
}

/**
 * Sanitize token symbol (uppercase, trim, max length)
 * @param {string} symbol - Token symbol
 * @returns {string} - Sanitized symbol
 */
export function sanitizeTokenSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return '';
  }

  return symbol
    .toString()
    .trim()
    .toUpperCase()
    .slice(0, 10)
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Sanitize address (trim, lowercase for comparison)
 * @param {string} address - Address
 * @returns {string} - Sanitized address
 */
export function sanitizeAddress(address) {
  if (!address || typeof address !== 'string') {
    return '';
  }

  return address.toString().trim();
}

/**
 * Sanitize amount (ensure numeric, positive)
 * @param {string|number} amount - Amount
 * @returns {string} - Sanitized amount string
 */
export function sanitizeAmount(amount) {
  if (!amount) {
    return '0';
  }

  const num = parseFloat(amount);
  if (isNaN(num) || num < 0 || !isFinite(num)) {
    return '0';
  }

  return num.toString();
}

/**
 * Validate and sanitize API parameters
 * @param {object} params - Parameters to validate
 * @param {object} schema - Validation schema
 * @returns {object} - { valid: boolean, sanitized: object, errors: array }
 */
export function validateParams(params, schema) {
  const errors = [];
  const sanitized = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = params[key];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip validation if optional and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Validate and sanitize based on type
    switch (rules.type) {
      case 'tokenSymbol':
        if (!isValidTokenSymbol(value)) {
          errors.push(`${key} must be a valid token symbol (2-10 alphanumeric characters)`);
        } else {
          sanitized[key] = sanitizeTokenSymbol(value);
        }
        break;

      case 'address':
        if (!isValidEthAddress(value)) {
          errors.push(`${key} must be a valid Ethereum address`);
        } else {
          sanitized[key] = sanitizeAddress(value);
        }
        break;

      case 'amount':
        if (!isValidAmount(value)) {
          errors.push(`${key} must be a positive number`);
        } else {
          sanitized[key] = sanitizeAmount(value);
        }
        break;

      case 'chainId':
        if (!isValidChainId(value)) {
          errors.push(`${key} must be a valid chain ID`);
        } else {
          sanitized[key] = parseInt(value);
        }
        break;

      case 'string':
        sanitized[key] = value.toString().trim().slice(0, rules.maxLength || 1000);
        break;

      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push(`${key} must be a number`);
        } else {
          sanitized[key] = num;
        }
        break;

      default:
        sanitized[key] = value;
    }
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Common validation schemas for API endpoints
 */
export const ValidationSchemas = {
  swapPrice: {
    sellToken: { type: 'tokenSymbol', required: true },
    buyToken: { type: 'tokenSymbol', required: true },
    sellAmount: { type: 'amount', required: true },
    chainId: { type: 'chainId', required: false },
    taker: { type: 'address', required: false }
  },
  
  tokenSearch: {
    query: { type: 'string', required: true, maxLength: 100 }
  },

  portfolio: {
    address: { type: 'address', required: true }
  },

  binancePrice: {
    symbol: { type: 'string', required: true, maxLength: 20 }
  }
};

/**
 * Guard wrapper for API calls - validates params before execution
 * @param {object} params - Parameters to validate
 * @param {object} schema - Validation schema
 * @returns {object} - { valid: boolean, sanitized: object, errors: array }
 */
export function guardParams(params, schema) {
  const result = validateParams(params, schema);
  
  if (!result.valid) {
    console.warn('🛡️ [ParamGuard] Validation failed:', result.errors);
  } else {
    console.log('🛡️ [ParamGuard] Validation passed:', Object.keys(result.sanitized));
  }

  return result;
}

