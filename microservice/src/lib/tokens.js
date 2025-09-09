// Chain‑scoped, strict allowlist. Add more only when verified.
// 0x Protocol supports multiple chains - here are the major ones
export const TOKENS = {
  1: { // Ethereum Mainnet
    ETH:  { symbol: "ETH",  address: "ETH", decimals: 18, name: "Ether" },
    WETH: { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, name: "Wrapped Ether" },
    USDC: { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6,  name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6,  name: "Tether USD" },
    DAI:  { symbol: "DAI",  address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, name: "Dai Stablecoin" },
    PEPE: { symbol: "PEPE", address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18, name: "Pepe" },
    SHIB: { symbol: "SHIB", address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18, name: "SHIBA INU" },
    UNI:  { symbol: "UNI",  address: "0x1f9840A85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, name: "Uniswap" },
    LINK: { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, name: "Chainlink" }
  },
  137: { // Polygon
    MATIC: { symbol: "MATIC", address: "ETH", decimals: 18, name: "Polygon" },
    WMATIC: { symbol: "WMATIC", address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", decimals: 18, name: "Wrapped Matic" },
    USDC: { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, name: "Tether USD" },
    WETH: { symbol: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, name: "Wrapped Ether" }
  },
  56: { // BSC (Binance Smart Chain)
    BNB: { symbol: "BNB", address: "ETH", decimals: 18, name: "BNB" },
    WBNB: { symbol: "WBNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18, name: "Wrapped BNB" },
    USDC: { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, name: "Tether USD" },
    BUSD: { symbol: "BUSD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18, name: "Binance USD" }
  },
  43114: { // Avalanche
    AVAX: { symbol: "AVAX", address: "ETH", decimals: 18, name: "Avalanche" },
    WAVAX: { symbol: "WAVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18, name: "Wrapped AVAX" },
    USDC: { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6, name: "Tether USD" }
  },
  42161: { // Arbitrum
    ETH: { symbol: "ETH", address: "ETH", decimals: 18, name: "Ether" },
    WETH: { symbol: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, name: "Wrapped Ether" },
    USDC: { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, name: "Tether USD" },
    ARB: { symbol: "ARB", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, name: "Arbitrum" }
  },
  10: { // Optimism
    ETH: { symbol: "ETH", address: "ETH", decimals: 18, name: "Ether" },
    WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, name: "Wrapped Ether" },
    USDC: { symbol: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, name: "USD Coin" },
    USDT: { symbol: "USDT", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6, name: "Tether USD" },
    OP: { symbol: "OP", address: "0x4200000000000000000000000000000000000042", decimals: 18, name: "Optimism" }
  },
  8453: { // Base
    ETH:  { symbol: "ETH",  address: "ETH", decimals: 18, name: "Ether" },
    WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, name: "Wrapped Ether" },
    USDC: { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913", decimals: 6,  name: "USD Coin" }
  }
};

function isEthEeeee(addr) {
  const a = String(addr || '').toLowerCase();
  return /^0x[eE]{4,}0{20,}$/i.test(a);
}

export function resolveTokenStrict(chainId, input) {
  const cid = Number(chainId);
  const reg = TOKENS[cid] || {};
  if (!input) throw new Error('Missing token');

  const sym = String(input).toUpperCase();
  if (reg[sym]) return reg[sym];

  const lowered = String(input).toLowerCase();
  if (isEthEeeee(lowered) && reg.ETH) return reg.ETH;

  for (const t of Object.values(reg)) {
    if (t.address !== 'ETH' && String(t.address).toLowerCase() === lowered) return t;
  }

  if (lowered.startsWith('0x') && lowered.length === 42) {
    throw new Error(`Unrecognized token address '${input}' on chain ${cid}. Only allowlisted tokens are supported.`);
  }

  const supported = Object.keys(reg).join(', ') || '—';
  throw new Error(`Unknown token '${input}' on chain ${cid}. Supported tokens: ${supported}.`);
}
