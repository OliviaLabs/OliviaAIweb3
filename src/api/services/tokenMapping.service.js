/**
 * Dynamic Token Mapping Service
 * Uses 0x API to get real-time token information instead of hardcoded addresses
 * Based on 0x documentation: https://0x.org/docs/0x-swap-api/guides/build-token-swap-dapp-nextjs
 */

import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

// Cache for token data to avoid repeated API calls
let tokenCache = new Map();
let tokenCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Static token mapping - reliable and fast
 */
const COMMON_TOKENS = new Map([
  ['ETH', { address: 'ETH', symbol: 'ETH', name: 'Ethereum', decimals: 18 }],
  ['WETH', { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 }],
  ['USDC', { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }],
  ['USDT', { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 }],
  ['DAI', { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 }],
  ['PEPE', { address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', symbol: 'PEPE', name: 'Pepe', decimals: 18 }],
  ['SHIB', { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18 }],
  ['UNI', { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 }],
  ['LINK', { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 }],
  ['WBTC', { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }]
]);

/**
 * Get static token mapping - no API calls needed
 */
function getStaticTokens() {
  return COMMON_TOKENS;
}

/**
 * Parse user message to extract swap information
 * Examples:
 * - "swap 10000 pepe to usdt"
 * - "trade 1 eth for usdc"
 * - "exchange 500 shib to dai"
 */
export function parseSwapMessage(message) {
  const msg = message.toLowerCase().trim();
  
  // Regex patterns to extract swap information
  const patterns = [
    // "swap 10000 pepe to usdt"
    /(?:swap|trade|exchange)\s+(\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i,
    // "swap pepe to usdt" (without amount)
    /(?:swap|trade|exchange)\s+([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i,
    // "10000 pepe to usdt"
    /(\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i,
    // "pepe to usdt" (without amount)
    /([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      if (match.length === 4) {
        // Pattern with amount: [full_match, amount, sellToken, buyToken]
        const [, amount, sellToken, buyToken] = match;
        return {
          sellToken: sellToken.toUpperCase(),
          buyToken: buyToken.toUpperCase(),
          sellAmount: amount,
          hasAmount: true
        };
      } else if (match.length === 3) {
        // Pattern without amount: [full_match, sellToken, buyToken]
        const [, sellToken, buyToken] = match;
        return {
          sellToken: sellToken.toUpperCase(),
          buyToken: buyToken.toUpperCase(),
          sellAmount: null,
          hasAmount: false
        };
      }
    }
  }
  
  return null;
}

/**
 * Get token info from symbol (static lookup)
 */
export function getTokenInfo(symbol) {
  const tokens = getStaticTokens();
  const upperSymbol = symbol.toUpperCase();
  return tokens.get(upperSymbol) || null;
}

/**
 * Convert token amount to wei (base units)
 */
export function convertToBaseUnits(amount, decimals = 18) {
  if (!amount) return null;
  
  console.log('🔢 convertToBaseUnits input:', { amount, decimals });
  
  // For large numbers, use BigInt to avoid scientific notation
  const amountStr = parseFloat(amount).toString();
  const [whole, fraction = ''] = amountStr.split('.');
  
  // Pad or trim fraction to match decimals
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  
  // Combine whole and fraction parts
  const fullNumber = whole + paddedFraction;
  
  // Remove leading zeros and return as string
  const result = BigInt(fullNumber).toString();
  
  console.log('🔢 convertToBaseUnits output:', result);
  console.log('🔢 Contains scientific notation?', result.includes('e'));
  
  return result;
}

/**
 * Validate if we support a token pair (static validation)
 */
export function validateTokenPair(sellToken, buyToken) {
  const sellTokenInfo = getTokenInfo(sellToken);
  const buyTokenInfo = getTokenInfo(buyToken);
  
  if (!sellTokenInfo || !buyTokenInfo) {
    return {
      valid: false,
      error: `Unsupported token: ${!sellTokenInfo ? sellToken : buyToken}`,
      availableTokens: Array.from(getStaticTokens().keys()).slice(0, 10) // Show first 10 available tokens
    };
  }
  
  if (sellToken.toUpperCase() === buyToken.toUpperCase()) {
    return {
      valid: false,
      error: "Cannot swap the same token"
    };
  }
  
  return {
    valid: true,
    sellTokenInfo,
    buyTokenInfo
  };
}

/**
 * Format swap data for 0x API call (static)
 */
export function formatSwapForAPI(swapInfo, userAddress = null) {
  console.log('🔧 formatSwapForAPI input:', swapInfo);
  const { sellToken, buyToken, sellAmount } = swapInfo;
  console.log('🔧 Extracted values:', { sellToken, buyToken, sellAmount });
  console.log('🔧 sellAmount type:', typeof sellAmount);
  console.log('🔧 sellAmount truthy?', !!sellAmount);
  console.log('🔧 sellAmount === null?', sellAmount === null);
  console.log('🔧 sellAmount === undefined?', sellAmount === undefined);
  
  const validation = validateTokenPair(sellToken, buyToken);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const { sellTokenInfo, buyTokenInfo } = validation;
  console.log('🔧 Token info:', { sellTokenInfo, buyTokenInfo });
  const sellAmountWei = sellAmount ? convertToBaseUnits(sellAmount, sellTokenInfo.decimals) : null;
  console.log('🔧 sellAmountWei result:', sellAmountWei);
  
  return {
    sellToken: sellTokenInfo.address,
    buyToken: buyTokenInfo.address,
    sellAmount: sellAmountWei,
    sellTokenInfo,
    buyTokenInfo,
    ...(userAddress && { takerAddress: userAddress })
  };
}
