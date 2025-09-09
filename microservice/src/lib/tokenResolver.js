// Dynamic token resolution using 0x Protocol API
// Instead of hardcoded lists, we validate tokens by querying 0x directly

import axios from 'axios';

const API = 'https://api.0x.org';
const VERSION = 'v2';

// Common token addresses across chains - for quick resolution
const COMMON_TOKENS = {
  1: { // Ethereum
    ETH: { symbol: "ETH", address: "ETH", decimals: 18, name: "Ether" },
    WETH: { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, name: "Wrapped Ether" },
    USDC: { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, name: "Tether USD" },
    DAI: { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, name: "Dai Stablecoin" },
    PEPE: { symbol: "PEPE", address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18, name: "Pepe" },
    SHIB: { symbol: "SHIB", address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18, name: "SHIBA INU" },
    UNI: { symbol: "UNI", address: "0x1f9840A85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, name: "Uniswap" },
    LINK: { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, name: "Chainlink" }
  },
  137: { // Polygon
    MATIC: { symbol: "MATIC", address: "ETH", decimals: 18, name: "Polygon" },
    WMATIC: { symbol: "WMATIC", address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", decimals: 18, name: "Wrapped Matic" },
    USDC: { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, name: "Tether USD" },
    WETH: { symbol: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, name: "Wrapped Ether" }
  },
  8453: { // Base
    ETH: { symbol: "ETH", address: "ETH", decimals: 18, name: "Ether" },
    WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, name: "Wrapped Ether" },
    USDC: { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913", decimals: 6, name: "USD Coin" }
  }
};

function headers() {
  const key = process.env.ZERO_EX_API_KEY;
  if (!key) throw new Error('Missing ZERO_EX_API_KEY');
  return {
    'Content-Type': 'application/json',
    '0x-api-key': key,
    '0x-version': VERSION,
  };
}

function isEthEeeee(addr) {
  const a = String(addr || '').toLowerCase();
  return /^0x[eE]{4,}0{20,}$/i.test(a);
}

/**
 * Resolve token info dynamically
 * 1. Check common tokens first (fast)
 * 2. If not found, validate with 0x API by making a test price call
 * 3. Extract decimals from the API response or use defaults
 */
export async function resolveToken(chainId, input) {
  const cid = Number(chainId);
  const commonTokens = COMMON_TOKENS[cid] || {};
  
  if (!input) throw new Error('Missing token');

  // Step 1: Check common tokens first
  const sym = String(input).toUpperCase();
  if (commonTokens[sym]) {
    console.log(`🔍 Token resolved from common list: ${sym} on chain ${cid}`);
    return commonTokens[sym];
  }

  // Step 2: Check if it's a direct address
  const lowered = String(input).toLowerCase();
  if (isEthEeeee(lowered) && commonTokens.ETH) {
    console.log(`🔍 Token resolved as ETH: ${input} on chain ${cid}`);
    return commonTokens.ETH;
  }

  // Check if input is already a contract address
  if (lowered.startsWith('0x') && lowered.length === 42) {
    console.log(`🔍 Attempting to resolve contract address: ${input} on chain ${cid}`);
    try {
      // Validate by making a test price call to 0x
      const tokenInfo = await validateTokenWithZeroX(cid, input);
      if (tokenInfo) {
        console.log(`✅ Token validated via 0x API: ${input} on chain ${cid}`);
        return tokenInfo;
      }
    } catch (error) {
      console.log(`❌ Token validation failed: ${input} on chain ${cid}`, error.message);
      throw new Error(`Token address '${input}' is not supported on chain ${cid} or lacks liquidity`);
    }
  }

  // Step 3: Unknown token symbol - provide helpful error
  const supportedSymbols = Object.keys(commonTokens).join(', ') || '—';
  throw new Error(`Unknown token '${input}' on chain ${cid}. Supported tokens: ${supportedSymbols}. For other tokens, use the contract address.`);
}

/**
 * Validate a token by making a test call to 0x API
 * This confirms the token exists and has liquidity
 */
async function validateTokenWithZeroX(chainId, tokenAddress) {
  try {
    // Use a small test amount to check if token is valid
    // We'll try to get a price quote against USDC or ETH
    const baseToken = COMMON_TOKENS[chainId]?.USDC?.address || COMMON_TOKENS[chainId]?.ETH?.address || 'ETH';
    
    const qs = new URLSearchParams({
      chainId: String(chainId),
      sellToken: tokenAddress,
      buyToken: baseToken,
      sellAmount: '1000000000000000000', // 1 token with 18 decimals
    });

    const url = `${API}/swap/allowance-holder/price?${qs.toString()}`;
    const response = await axios.get(url, { headers: headers() });

    if (response.data && response.data.sellTokenToEthRate) {
      // Extract token info from the response
      return {
        symbol: tokenAddress.substring(0, 8) + '...', // Short display name
        address: tokenAddress,
        decimals: 18, // Default, could be refined by checking the actual token
        name: `Token ${tokenAddress.substring(0, 8)}...`,
        validated: true
      };
    }

    throw new Error('No liquidity found');
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error('Token not found or no liquidity available');
    }
    throw error;
  }
}

/**
 * Get list of common tokens for a chain
 */
export function getCommonTokens(chainId) {
  const cid = Number(chainId);
  return Object.values(COMMON_TOKENS[cid] || {});
}

/**
 * Legacy function for backward compatibility
 */
export function resolveTokenStrict(chainId, input) {
  return resolveToken(chainId, input);
}
