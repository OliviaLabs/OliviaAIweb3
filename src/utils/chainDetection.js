/**
 * Dynamic Chain Detection using Reown/WalletConnect
 * Detects supported chains and tokens for any connected wallet
 */

// Reown supported networks - this is the comprehensive list
export const REOWN_SUPPORTED_NETWORKS = {
  // Ethereum ecosystem
  1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth-mainnet.g.alchemy.com/v2/', alchemy: 'eth-mainnet' },
  8453: { name: 'Base', symbol: 'ETH', rpc: 'https://base-mainnet.g.alchemy.com/v2/', alchemy: 'base-mainnet' },
  10: { name: 'Optimism', symbol: 'ETH', rpc: 'https://opt-mainnet.g.alchemy.com/v2/', alchemy: 'opt-mainnet' },
  42161: { name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb-mainnet.g.alchemy.com/v2/', alchemy: 'arb-mainnet' },
  
  // Other major chains
  137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-mainnet.g.alchemy.com/v2/', alchemy: 'polygon-mainnet' },
  56: { name: 'BSC', symbol: 'BNB', rpc: 'https://bsc-mainnet.g.alchemy.com/v2/', alchemy: 'bsc-mainnet' },
  250: { name: 'Fantom', symbol: 'FTM', rpc: 'https://fantom-mainnet.g.alchemy.com/v2/', alchemy: 'fantom-mainnet' },
  43114: { name: 'Avalanche', symbol: 'AVAX', rpc: 'https://avax-mainnet.g.alchemy.com/v2/', alchemy: 'avax-mainnet' },
  
  // Additional chains supported by Reown
  100: { name: 'Gnosis', symbol: 'XDAI', rpc: 'https://gnosis-mainnet.g.alchemy.com/v2/', alchemy: 'gnosis-mainnet' },
  324: { name: 'zkSync Era', symbol: 'ETH', rpc: 'https://zksync-mainnet.g.alchemy.com/v2/', alchemy: 'zksync-mainnet' },
  5000: { name: 'Mantle', symbol: 'MNT', rpc: 'https://mantle-mainnet.g.alchemy.com/v2/', alchemy: 'mantle-mainnet' },
  59144: { name: 'Linea', symbol: 'ETH', rpc: 'https://linea-mainnet.g.alchemy.com/v2/', alchemy: 'linea-mainnet' },
  81457: { name: 'Blast', symbol: 'ETH', rpc: 'https://blast-mainnet.g.alchemy.com/v2/', alchemy: 'blast-mainnet' }
};

/**
 * Get the correct Alchemy network URL for any chain
 */
export function getAlchemyNetwork(chainId) {
  const network = REOWN_SUPPORTED_NETWORKS[chainId];
  return network?.alchemy || 'eth-mainnet';
}

/**
 * Get network info for any chain ID
 */
export function getNetworkInfo(chainId) {
  return REOWN_SUPPORTED_NETWORKS[chainId] || {
    name: 'Unknown',
    symbol: 'UNKNOWN',
    rpc: 'https://eth-mainnet.g.alchemy.com/v2/',
    alchemy: 'eth-mainnet'
  };
}

/**
 * Check if a chain is supported by Reown
 */
export function isChainSupported(chainId) {
  return chainId in REOWN_SUPPORTED_NETWORKS;
}

/**
 * Get all supported chain IDs
 */
export function getAllSupportedChainIds() {
  return Object.keys(REOWN_SUPPORTED_NETWORKS).map(Number);
}

/**
 * Detect what chains the connected wallet supports
 * This uses Reown's wallet capabilities but avoids triggering network additions
 */
export async function detectWalletSupportedChains(connector) {
  if (!connector) return [];
  
  try {
    // Get wallet capabilities from Reown
    const capabilities = await connector.getCapabilities?.();
    
    if (capabilities?.supportedChains) {
      console.log(`🔗 Wallet supports chains:`, capabilities.supportedChains);
      return capabilities.supportedChains;
    }
    
    // Get the wallet's current chain
    const currentChain = connector.chains?.[0];
    if (currentChain) {
      console.log(`🔗 Current wallet chain: ${currentChain.name} (${currentChain.id})`);
      
      // Check all major L2s and L1s that are commonly supported
      // This gives users a complete view of their multi-chain assets
      const allSupportedChains = [
        currentChain.id, // Always include current chain
        1,    // Ethereum
        8453, // Base
        137,  // Polygon
        10,   // Optimism
        42161, // Arbitrum
        56,   // BSC
        250,  // Fantom
        43114, // Avalanche
        100,  // Gnosis
        324,  // zkSync Era
        5000, // Mantle
        59144, // Linea
        81457 // Blast
      ];
      
      // Remove duplicates and return
      const uniqueChains = [...new Set(allSupportedChains)];
      console.log(`🔗 Checking all major chains for multi-chain detection:`, uniqueChains);
      return uniqueChains;
    }
    
    // Fallback to all major chains
    console.log(`🔗 Using comprehensive fallback: All major chains`);
    return [1, 8453, 137, 10, 42161, 56, 250, 43114, 100, 324, 5000, 59144, 81457];
  } catch (error) {
    console.warn('Could not detect wallet capabilities:', error);
    // Comprehensive fallback
    return [1, 8453, 137, 10, 42161, 56, 250, 43114, 100, 324, 5000, 59144, 81457];
  }
}

/**
 * Get tokens for a specific chain using Alchemy
 */
export async function getTokensForChain(address, chainId) {
  if (!address || !chainId) return [];
  
  const network = getAlchemyNetwork(chainId);
  const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '_pGB49JjZobNT7IahUuqg';
  
  try {
    // Get token balances
    const response = await fetch(
      `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [address]
        })
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.result?.tokenBalances) return [];
    
    // Filter out zero balances
    const nonZeroTokens = data.result.tokenBalances.filter(
      token => token.tokenBalance !== '0x0' && 
              token.tokenBalance !== '0x00' && 
              token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
    
    // Get metadata for each token
    const tokenPromises = nonZeroTokens.slice(0, 10).map(async (token) => {
      try {
        const metadataResponse = await fetch(
          `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 1,
              jsonrpc: '2.0',
              method: 'alchemy_getTokenMetadata',
              params: [token.contractAddress]
            })
          }
        );
        
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          const metadata = metadataData.result;
          const balance = parseInt(token.tokenBalance, 16);
          const decimals = metadata?.decimals || 18;
          const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(6);
          
          return {
            symbol: metadata?.symbol || 'Unknown',
            name: metadata?.name || 'Unknown Token',
            balance: formattedBalance,
            decimals: decimals,
            contractAddress: token.contractAddress,
            logo: metadata?.logo,
            chainId: chainId,
            chainName: getNetworkInfo(chainId).name
          };
        }
      } catch (err) {
        console.error('Error fetching token metadata:', err);
      }
      return null;
    });
    
    const tokens = (await Promise.all(tokenPromises)).filter(t => t !== null);
    console.log(`🔍 Found ${tokens.length} tokens on ${getNetworkInfo(chainId).name} (${chainId})`);
    
    return tokens;
  } catch (error) {
    console.error(`Failed to fetch tokens for chain ${chainId}:`, error);
    return [];
  }
}

/**
 * Detect all tokens across all supported chains for a wallet
 */
export async function detectAllWalletTokens(address, connector) {
  if (!address || !connector) return [];
  
  const supportedChains = await detectWalletSupportedChains(connector);
  console.log(`🔍 Wallet supports chains:`, supportedChains);
  
  // Get tokens from all supported chains
  const allTokens = [];
  for (const chainId of supportedChains) {
    const tokens = await getTokensForChain(address, chainId);
    allTokens.push(...tokens);
  }
  
  return allTokens;
}
