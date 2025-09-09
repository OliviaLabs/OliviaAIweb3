// Chain‑scoped, strict allowlist. Add more only when verified.
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
