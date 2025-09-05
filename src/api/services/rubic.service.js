/**
 * Rubic SDK Service
 * Handles cross-chain and on-chain trading operations
 */

class RubicService {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Rubic SDK
   */
  async initialize() {
    try {
      // Dynamic import to avoid SSR issues
      const { SDK, BLOCKCHAIN_NAME } = await import('rubic-sdk');
      
      const configuration = {
        rpcProviders: {
          [BLOCKCHAIN_NAME.ETHEREUM]: {
            rpcList: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth']
          },
          [BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN]: {
            rpcList: ['https://bsc-dataseed.binance.org', 'https://rpc.ankr.com/bsc']
          },
          [BLOCKCHAIN_NAME.POLYGON]: {
            rpcList: ['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon']
          },
          [BLOCKCHAIN_NAME.ARBITRUM]: {
            rpcList: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum']
          },
          [BLOCKCHAIN_NAME.OPTIMISM]: {
            rpcList: ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism']
          },
          [BLOCKCHAIN_NAME.BASE]: {
            rpcList: ['https://mainnet.base.org', 'https://rpc.ankr.com/base']
          }
        }
      };

      this.sdk = await SDK.createSDK(configuration);
      this.isInitialized = true;
      console.log('Rubic SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Rubic SDK:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get supported blockchains
   */
  async getSupportedBlockchains() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { BLOCKCHAIN_NAME } = await import('rubic-sdk');
      return Object.values(BLOCKCHAIN_NAME);
    } catch (error) {
      console.error('Error getting supported blockchains:', error);
      return [];
    }
  }

  /**
   * Calculate on-chain trade
   */
  async calculateOnChainTrade(fromBlockchain, fromTokenAddress, fromAmount, toTokenAddress) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.sdk) {
      throw new Error('Rubic SDK not initialized');
    }

    try {
      const trades = await this.sdk.onChainManager.calculateTrade(
        { blockchain: fromBlockchain, address: fromTokenAddress },
        fromAmount,
        toTokenAddress
      );

      return trades;
    } catch (error) {
      console.error('Error calculating on-chain trade:', error);
      throw error;
    }
  }

  /**
   * Calculate cross-chain trade
   */
  async calculateCrossChainTrade(
    fromBlockchain, 
    fromTokenAddress, 
    fromAmount, 
    toBlockchain, 
    toTokenAddress
  ) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.sdk) {
      throw new Error('Rubic SDK not initialized');
    }

    try {
      const trades = await this.sdk.crossChainManager.calculateTrade(
        { blockchain: fromBlockchain, address: fromTokenAddress },
        fromAmount,
        { blockchain: toBlockchain, address: toTokenAddress }
      );

      return trades;
    } catch (error) {
      console.error('Error calculating cross-chain trade:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(blockchain, tokenAddress) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { Token } = await import('rubic-sdk');
      const token = await Token.createToken({ 
        blockchain, 
        address: tokenAddress 
      });

      return {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens for a blockchain
   */
  async getSupportedTokens(blockchain) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // This would typically come from Rubic's API or configuration
      // For now, return common tokens
      const commonTokens = {
        ethereum: [
          { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum' },
          { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether USD' },
          { address: '0xa0b86a33e6441b8c4c8c0e4c8c0e4c8c0e4c8c0e', symbol: 'USDC', name: 'USD Coin' }
        ],
        base: [
          { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum' },
          { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', name: 'USD Coin' }
        ]
      };

      return commonTokens[blockchain.toLowerCase()] || [];
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      return [];
    }
  }

  /**
   * Get trading statistics
   */
  async getTradingStats() {
    try {
      // Mock data for now - in a real implementation, this would come from Rubic's API
      return {
        totalVolume: '$2.5B+',
        totalTrades: '500K+',
        supportedChains: 15,
        supportedTokens: 1000
      };
    } catch (error) {
      console.error('Error getting trading stats:', error);
      return {
        totalVolume: 'N/A',
        totalTrades: 'N/A',
        supportedChains: 0,
        supportedTokens: 0
      };
    }
  }
}

export const rubicService = new RubicService();
