import axios from 'axios';

/**
 * Token ID Resolver Agent
 * Converts token symbols/names to correct API IDs and contract addresses
 * Follows the exact process: Search → Get correct ID/Contract → Return data
 */
export class TokenResolverAgent {
  
  /**
   * Network name mappings between different API formats
   */
  static NETWORK_MAPPINGS = {
    'ethereum': {
      alchemy: 'eth-mainnet',
      okx: '1',
      zerox: 'ethereum',
      chainId: '1',
      coingecko: 'ethereum'
    },
    'binance-smart-chain': {
      alchemy: 'bsc-mainnet',
      okx: '56',
      zerox: 'bsc',
      chainId: '56',
      coingecko: 'binance-smart-chain'
    },
    'bnb': {  // Alias for BSC
      alchemy: 'bsc-mainnet',
      okx: '56',
      zerox: 'bsc',
      chainId: '56',
      coingecko: 'binance-smart-chain'
    },
    'polygon': {
      alchemy: 'polygon-mainnet',
      okx: '137',
      zerox: 'polygon',
      chainId: '137',
      coingecko: 'polygon-pos'
    },
    'arbitrum': {
      alchemy: 'arb-mainnet',
      okx: '42161',
      zerox: 'arbitrum',
      chainId: '42161',
      coingecko: 'arbitrum-one'
    },
    'optimism': {
      alchemy: 'opt-mainnet',
      okx: '10',
      zerox: 'optimism',
      chainId: '10',
      coingecko: 'optimistic-ethereum'
    },
    'solana': {
      chainId: 'solana',
      coingecko: 'solana'
    },
    'ton': {
      chainId: 'ton',
      coingecko: 'the-open-network'
    }
  };
  
  /**
   * Resolve token symbol to CoinGecko ID
   * @param {string} tokenSymbol - Token symbol (e.g., "BROCCOLI", "BTC")
   * @returns {Promise<string|null>} - Correct CoinGecko ID or null if not found
   */
  static async resolveCoinGeckoId(tokenSymbol) {
    if (!tokenSymbol) return null;
    
    console.log(`🔍 [Token Resolver] Searching for: ${tokenSymbol}`);
    
    try {
      // STEP 1: Search CoinGecko for the token
      const searchResponse = await axios.get('https://api.coingecko.com/api/v3/search', {
        params: { query: tokenSymbol }
      });
      
      const coins = searchResponse.data?.coins || [];
      
      if (coins.length === 0) {
        console.log(`❌ [Token Resolver] No results for: ${tokenSymbol}`);
        return null;
      }
      
      // STEP 2: Find best match (prioritize by rank)
      // Filter coins that match the symbol
      const exactMatches = coins.filter(coin => 
        coin.symbol?.toLowerCase() === tokenSymbol.toLowerCase()
      );
      
      // If we have exact symbol matches, pick the one with best rank
      const bestMatch = exactMatches.length > 0 
        ? exactMatches.reduce((best, current) => 
            (current.market_cap_rank || 999999) < (best.market_cap_rank || 999999) ? current : best
          )
        : coins[0]; // Fallback to first result if no exact match
      
      console.log(`✅ [Token Resolver] Found: ${bestMatch.symbol} → ${bestMatch.id} (rank: ${bestMatch.market_cap_rank})`);
      
      // STEP 3: Return the correct ID
      return bestMatch.id;
      
    } catch (error) {
      console.error(`❌ [Token Resolver] Search failed for ${tokenSymbol}:`, error.message);
      return null;
    }
  }
  
  /**
   * Resolve contract address for a token on a specific blockchain
   * @param {string} tokenSymbol - Token symbol (e.g., "BROCCOLI")
   * @param {string} blockchain - Blockchain name (e.g., "ethereum", "binance-smart-chain")
   * @returns {Promise<string|null>} - Contract address or null
   */
  static async resolveContractAddress(tokenSymbol, blockchain) {
    if (!tokenSymbol || !blockchain) return null;
    
    console.log(`🔍 [Token Resolver] Resolving contract for ${tokenSymbol} on ${blockchain}`);
    
    try {
      // STEP 1: Get CoinGecko ID
      const coinId = await this.resolveCoinGeckoId(tokenSymbol);
      if (!coinId) {
        console.log(`❌ [Token Resolver] Could not find CoinGecko ID for ${tokenSymbol}`);
        return null;
      }
      
      // STEP 2: Get full coin details including platforms
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: false,
          community_data: false,
          developer_data: false
        }
      });
      
      const platforms = response.data?.platforms;
      if (!platforms) {
        console.log(`❌ [Token Resolver] No platform data for ${coinId}`);
        return null;
      }
      
      // STEP 3: Extract contract address for the specific blockchain
      // Try exact match first
      let contract = platforms[blockchain];
      
      // If not found, try variations
      if (!contract) {
        const blockchainLower = blockchain.toLowerCase();
        const normalizedBlockchain = this.NETWORK_MAPPINGS[blockchainLower]?.coingecko || blockchainLower;
        contract = platforms[normalizedBlockchain];
      }
      
      // Log all available platforms for debugging
      console.log(`📋 [Token Resolver] Available platforms for ${tokenSymbol}:`, Object.keys(platforms));
      
      if (contract) {
        console.log(`✅ [Token Resolver] Found contract: ${contract} on ${blockchain}`);
      } else {
        console.log(`❌ [Token Resolver] No contract found for ${blockchain}`);
      }
      
      return contract || null;
      
    } catch (error) {
      console.error(`❌ [Token Resolver] Contract resolution failed for ${tokenSymbol}:`, error.message);
      return null;
    }
  }
  
  /**
   * Map network name to API-specific format
   * @param {string} networkName - Network name (e.g., "ethereum", "binance-smart-chain")
   * @param {string} targetAPI - Target API format (e.g., "alchemy", "okx", "zerox")
   * @returns {string|null} - Mapped network name
   */
  static mapNetwork(networkName, targetAPI) {
    const normalized = networkName?.toLowerCase();
    const mapping = this.NETWORK_MAPPINGS[normalized];
    
    if (!mapping) {
      console.log(`⚠️ [Token Resolver] Unknown network: ${networkName}`);
      return null;
    }
    
    const mapped = mapping[targetAPI];
    console.log(`🗺️ [Token Resolver] Mapped ${networkName} → ${mapped} (for ${targetAPI})`);
    
    return mapped || null;
  }
  
  /**
   * Resolve multiple tokens at once
   * @param {Array<string>} tokenSymbols - Array of token symbols
   * @returns {Promise<Object>} - Map of symbol → ID
   */
  static async resolveMultiple(tokenSymbols) {
    if (!tokenSymbols || tokenSymbols.length === 0) return {};
    
    console.log(`🔍 [Token Resolver] Resolving ${tokenSymbols.length} tokens...`);
    
    const results = {};
    
    // Resolve all tokens in parallel
    await Promise.all(
      tokenSymbols.map(async (symbol) => {
        const id = await this.resolveCoinGeckoId(symbol);
        if (id) {
          results[symbol] = id;
        }
      })
    );
    
    console.log(`✅ [Token Resolver] Resolved ${Object.keys(results).length}/${tokenSymbols.length} tokens`);
    
    return results;
  }
  
  /**
   * Enhance API params with resolved IDs, contracts, and networks
   * @param {string} api - API endpoint
   * @param {object} params - Original params
   * @param {object} entities - Entities from Reasoning Agent
   * @returns {Promise<object>} - Enhanced params with correct IDs/contracts
   */
  static async enhanceParams(api, params, entities) {
    // ========== COINGECKO APIS ==========
    if (api.includes('coingecko/coins/') || api.includes('coingecko/prices')) {
      if (params.coinId && entities.tokens?.length > 0) {
        const resolvedId = await this.resolveCoinGeckoId(entities.tokens[0]);
        if (resolvedId) {
          console.log(`🔄 [Token Resolver] CoinGecko: ${params.coinId} → ${resolvedId}`);
          return { ...params, coinId: resolvedId };
        }
      }
      
      if (params.ids && entities.tokens?.length > 0) {
        const resolvedId = await this.resolveCoinGeckoId(entities.tokens[0]);
        if (resolvedId) {
          console.log(`🔄 [Token Resolver] CoinGecko: ${params.ids} → ${resolvedId}`);
          return { ...params, ids: resolvedId };
        }
      }
    }
    
    // ========== COINSTATS APIS ==========
    if (api.includes('coinstats/coins/') && params.coinId && entities.tokens?.length > 0) {
      // CoinStats uses similar IDs to CoinGecko, try resolving
      const resolvedId = await this.resolveCoinGeckoId(entities.tokens[0]);
      if (resolvedId) {
        console.log(`🔄 [Token Resolver] CoinStats: ${params.coinId} → ${resolvedId}`);
        return { ...params, coinId: resolvedId };
      }
    }
    
    // ========== 0X PROTOCOL APIS ==========
    if (api.includes('zerox/') || api.includes('0x/')) {
      let enhanced = { ...params };
      
      // Resolve sellToken if it's a symbol
      if (params.sellToken && entities.tokens?.length > 0) {
        const blockchain = entities.blockchains?.[0] || 'ethereum';
        const contract = await this.resolveContractAddress(entities.tokens[0], blockchain);
        if (contract) {
          console.log(`🔄 [Token Resolver] 0x sellToken: ${params.sellToken} → ${contract}`);
          enhanced.sellToken = contract;
        }
      }
      
      // Resolve buyToken if it's a symbol
      if (params.buyToken && entities.tokens?.length > 1) {
        const blockchain = entities.blockchains?.[0] || 'ethereum';
        const contract = await this.resolveContractAddress(entities.tokens[1], blockchain);
        if (contract) {
          console.log(`🔄 [Token Resolver] 0x buyToken: ${params.buyToken} → ${contract}`);
          enhanced.buyToken = contract;
        }
      }
      
      return enhanced;
    }
    
    // ========== OKX APIS ==========
    if (api.includes('okx/')) {
      let enhanced = { ...params };
      
      // Resolve fromTokenAddress
      if (params.fromTokenAddress && entities.tokens?.length > 0) {
        const blockchain = entities.blockchains?.[0] || 'ethereum';
        const contract = await this.resolveContractAddress(entities.tokens[0], blockchain);
        if (contract) {
          console.log(`🔄 [Token Resolver] OKX fromToken: ${params.fromTokenAddress} → ${contract}`);
          enhanced.fromTokenAddress = contract;
        }
      }
      
      // Resolve toTokenAddress
      if (params.toTokenAddress && entities.tokens?.length > 1) {
        const blockchain = entities.blockchains?.[0] || 'ethereum';
        const contract = await this.resolveContractAddress(entities.tokens[1], blockchain);
        if (contract) {
          console.log(`🔄 [Token Resolver] OKX toToken: ${params.toTokenAddress} → ${contract}`);
          enhanced.toTokenAddress = contract;
        }
      }
      
      // Map chainId if blockchain is mentioned
      if (entities.blockchains?.length > 0 && !params.chainId) {
        const chainId = this.mapNetwork(entities.blockchains[0], 'okx');
        if (chainId) {
          enhanced.chainId = chainId;
        }
      }
      
      return enhanced;
    }
    
    // ========== ALCHEMY APIS ==========
    if (api.includes('alchemy/')) {
      let enhanced = { ...params };
      
      // Resolve contract address for token-metadata
      if (params.contractAddress && entities.tokens?.length > 0) {
        const blockchain = entities.blockchains?.[0] || 'ethereum';
        const contract = await this.resolveContractAddress(entities.tokens[0], blockchain);
        if (contract) {
          console.log(`🔄 [Token Resolver] Alchemy contract: ${params.contractAddress} → ${contract}`);
          enhanced.contractAddress = contract;
        }
      }
      
      // Map network name for Alchemy format
      if (entities.blockchains?.length > 0) {
        const network = this.mapNetwork(entities.blockchains[0], 'alchemy');
        if (network && !params.network) {
          enhanced.network = network;
        }
      }
      
      return enhanced;
    }
    
    // ========== CHANGENOW APIS ==========
    if (api.includes('changenow/')) {
      let enhanced = { ...params };
      
      // Convert to lowercase for ChangeNOW
      if (params.from && typeof params.from === 'string') {
        enhanced.from = params.from.toLowerCase();
      }
      if (params.to && typeof params.to === 'string') {
        enhanced.to = params.to.toLowerCase();
      }
      
      console.log(`🔄 [Token Resolver] ChangeNOW: Converted to lowercase`);
      return enhanced;
    }
    
    // ========== TWITTER APIS ==========
    if (api.includes('twitter/')) {
      let enhanced = { ...params };
      
      // Add $ prefix to token symbols if not already present
      if (params.query && entities.tokens?.length > 0) {
        const token = entities.tokens[0];
        if (!params.query.includes('$')) {
          enhanced.query = `$${token} ${params.query}`.trim();
          console.log(`🔄 [Token Resolver] Twitter: Added $ prefix to ${token}`);
        }
      }
      
      return enhanced;
    }
    
    // ========== CHAINBASE APIS ==========
    if (api.includes('chainbase/')) {
      let enhanced = { ...params };
      
      // Map chainId if needed
      if (entities.blockchains?.length > 0 && params.chainId) {
        const chainId = this.mapNetwork(entities.blockchains[0], 'chainId');
        if (chainId) {
          enhanced.chainId = chainId;
        }
      }
      
      return enhanced;
    }
    
    // No enhancement needed for other APIs
    return params;
  }
}

