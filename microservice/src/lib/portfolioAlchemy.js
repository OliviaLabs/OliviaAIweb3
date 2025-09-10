// microservice/src/lib/portfolioAlchemy.js
import fetch from "node-fetch";

const CHAIN_RPC = {
  8453: (k) => `https://base-mainnet.g.alchemy.com/v2/${k}`,      // Base
  1:    (k) => `https://eth-mainnet.g.alchemy.com/v2/${k}`,        // Ethereum
  42161:(k) => `https://arb-mainnet.g.alchemy.com/v2/${k}`,        // Arbitrum
  10:   (k) => `https://opt-mainnet.g.alchemy.com/v2/${k}`,        // Optimism
  137:  (k) => `https://polygon-mainnet.g.alchemy.com/v2/${k}`,    // Polygon
};

const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '_pGB49JjZobNT7IahUuqg';

function rpcUrl(chainId) {
  const b = CHAIN_RPC[chainId];
  if (!b) throw new Error(`Unsupported chainId ${chainId}`);
  if (!ALCHEMY_KEY) throw new Error("Missing ALCHEMY_KEY env");
  return b(ALCHEMY_KEY);
}

async function rpcCall(url, method, params) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  if (!r.ok) throw new Error(`${method} HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`${method} error: ${j.error.message}`);
  return j.result;
}

function hexToBigInt(h) { return BigInt(h || "0x0"); }

// minimal, fast formatter for display (avoids BigInt→Number overflow)
function formatUnits(rawBig, decimals = 18) {
  const s = rawBig.toString();
  if (decimals === 0) return s;
  const pad = decimals - s.length + 1;
  if (pad > 0) {
    const frac = "0".repeat(pad) + s;
    const whole = "0";
    const fracTrim = frac.slice(-decimals).replace(/0+$/, "");
    return fracTrim ? `${whole}.${fracTrim}` : whole;
  }
  const i = s.length - decimals;
  const whole = s.slice(0, i);
  const fracTrim = s.slice(i).replace(/0+$/, "");
  return fracTrim ? `${whole}.${fracTrim}` : whole;
}

// Simple price fetcher using CoinGecko
async function getTokenPrices(tokens) {
  try {
    // Get unique symbols for price lookup
    const symbols = [...new Set(tokens.map(t => t.symbol.toLowerCase()))];
    const symbolsQuery = symbols.join(',');
    
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbolsQuery}&vs_currencies=usd`);
    if (!response.ok) {
      // Fallback: try by symbol instead of ID
      const symbolResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?symbols=${symbolsQuery}&vs_currencies=usd`);
      if (symbolResponse.ok) {
        return await symbolResponse.json();
      }
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('Price fetch error:', error);
    return {};
  }
}

// Multi-chain wallet scanner - checks ALL chains for tokens
export async function getPortfolioAlchemy(address) {
  const allChains = [
    { id: 8453, name: "Base", symbol: "ETH" },
    { id: 1, name: "Ethereum", symbol: "ETH" },
    { id: 137, name: "Polygon", symbol: "MATIC" },
    { id: 42161, name: "Arbitrum", symbol: "ETH" },
    { id: 10, name: "Optimism", symbol: "ETH" }
  ];

  console.log(`🔍 Scanning wallet ${address} across ${allChains.length} chains...`);
  
  const allTokens = [];

  // Check each chain in parallel
  const chainPromises = allChains.map(async (chain) => {
    try {
      console.log(`🔍 Checking ${chain.name} (${chain.id})...`);
      const url = rpcUrl(chain.id);
      const chainTokens = [];

      // 1) Check native balance
      const nativeHex = await rpcCall(url, "eth_getBalance", [address, "latest"]);
      const nativeRaw = hexToBigInt(nativeHex);
      if (nativeRaw > 0n) {
        chainTokens.push({
          chainId: chain.id,
          chain: chain.name,
          type: "native",
          symbol: chain.symbol,
          balanceRaw: nativeRaw.toString(),
          balance: formatUnits(nativeRaw, 18),
        });
        console.log(`✅ Found ${formatUnits(nativeRaw, 18)} ${chain.symbol} on ${chain.name}`);
      }

      // 2) Check ERC-20 tokens
      const tb = await rpcCall(url, "alchemy_getTokenBalances", [address]);
      const tokens = (tb?.tokenBalances || []).filter(
        t => t.tokenBalance && t.tokenBalance !== "0x0" && t.tokenBalance !== "0x00"
      );

      if (tokens.length > 0) {
        console.log(`🪙 Found ${tokens.length} ERC-20 tokens on ${chain.name}`);
        
        // Get metadata for tokens (limit to prevent API overload)
        const limit = 5;
        for (let i = 0; i < Math.min(tokens.length, limit); i++) {
          try {
            const t = tokens[i];
            const meta = await rpcCall(url, "alchemy_getTokenMetadata", [t.contractAddress]);
            const raw = hexToBigInt(t.tokenBalance);
            const decimals = Number(meta?.decimals ?? 18);
            const symbol = meta?.symbol || "UNKNOWN";
            
            if (raw > 0n) {
              chainTokens.push({
                chainId: chain.id,
                chain: chain.name,
                type: "erc20",
                address: t.contractAddress,
                symbol,
                decimals,
                balanceRaw: raw.toString(),
                balance: formatUnits(raw, decimals),
              });
              console.log(`✅ Found ${formatUnits(raw, decimals)} ${symbol} on ${chain.name}`);
            }
          } catch (metaError) {
            console.error(`Error getting token metadata on ${chain.name}:`, metaError);
          }
        }
      }

      return chainTokens;
    } catch (error) {
      console.error(`Error scanning ${chain.name}:`, error);
      return [];
    }
  });

  // Wait for all chains to complete
  const chainResults = await Promise.all(chainPromises);
  
  // Flatten all results
  chainResults.forEach(chainTokens => {
    allTokens.push(...chainTokens);
  });

  console.log(`🎯 Total tokens found across all chains: ${allTokens.length}`);

  // Sort: native first, then by chain, then alphabetically
  allTokens.sort((a, b) => {
    if (a.type === "native" && b.type !== "native") return -1;
    if (b.type === "native" && a.type !== "native") return 1;
    if (a.chainId !== b.chainId) return a.chainId - b.chainId;
    return (a.symbol || "").localeCompare(b.symbol || "");
  });
  
  // 3) Add pricing data
  if (allTokens.length > 0) {
    try {
      console.log(`💰 Fetching prices for ${allTokens.length} tokens...`);
      const prices = await getTokenPrices(allTokens);
      
      // Add price and USD value to each token
      allTokens.forEach(token => {
        const symbol = token.symbol.toLowerCase();
        const price = prices[symbol]?.usd || prices[`${symbol}coin`]?.usd || 
                     prices[token.symbol]?.usd || prices[`${token.symbol.toLowerCase()}`]?.usd;
        
        if (price) {
          token.priceUSD = price;
          const balanceNum = parseFloat(token.balance);
          if (!isNaN(balanceNum)) {
            token.valueUSD = (balanceNum * price).toFixed(2);
          }
        }
      });
    } catch (priceError) {
      console.error('Error fetching prices:', priceError);
    }
  }
  
  return allTokens;
}
