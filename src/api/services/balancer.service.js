import axios from 'axios';

/**
 * Balancer on Base API Service
 * Free tier: No API key needed, rate limited
 */

const BALANCER_BASE_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-base';

export const balancerService = {
  // Get pools on Base
  async getPools(limit = 20) {
    try {
      const query = `
        query GetPools($limit: Int!) {
          pools(
            first: $limit
            orderBy: totalLiquidity
            orderDirection: desc
            where: { totalLiquidity_gt: "0" }
          ) {
            id
            name
            symbol
            totalLiquidity
            totalShares
            tokens {
              id
              symbol
              name
              decimals
              balance
              weight
            }
            swapFee
            totalSwapVolume
            totalSwapFee
            txCount
          }
        }
      `;
      
      const { data } = await axios.post(BALANCER_BASE_SUBGRAPH, {
        query,
        variables: { limit }
      });
      
      return data.data?.pools || [];
    } catch (error) {
      console.error('Balancer pools fetch error:', error);
      throw error;
    }
  },

  // Get specific pool info
  async getPoolInfo(poolAddress) {
    try {
      const query = `
        query GetPoolInfo($poolAddress: String!) {
          pool(id: $poolAddress) {
            id
            name
            symbol
            totalLiquidity
            totalShares
            tokens {
              id
              symbol
              name
              decimals
              balance
              weight
            }
            swapFee
            totalSwapVolume
            totalSwapFee
            txCount
          }
        }
      `;
      
      const { data } = await axios.post(BALANCER_BASE_SUBGRAPH, {
        query,
        variables: { poolAddress: poolAddress.toLowerCase() }
      });
      
      return data.data?.pool;
    } catch (error) {
      console.error('Balancer pool info fetch error:', error);
      throw error;
    }
  },

  // Get BAL token price
  async getBALTokenPrice() {
    try {
      const query = `
        query GetBALPrice {
          token(id: "0x415d8aa4a9938f7c4b9b4c9c3b8b4c9c3b8b4c9c3") {
            id
            symbol
            name
            decimals
            totalSupply
            totalValueLockedUSD
            volumeUSD
            txCount
          }
        }
      `;
      
      const { data } = await axios.post(BALANCER_BASE_SUBGRAPH, {
        query
      });
      
      return data.data?.token;
    } catch (error) {
      console.error('Balancer BAL token price error:', error);
      throw error;
    }
  },

  // Get swap rate estimate
  async getSwapRate(poolAddress, tokenIn, tokenOut, amountIn) {
    try {
      const pool = await this.getPoolInfo(poolAddress);
      if (!pool) return null;

      // Find token info
      const tokenInInfo = pool.tokens.find(token => 
        token.id.toLowerCase() === tokenIn.toLowerCase()
      );
      const tokenOutInfo = pool.tokens.find(token => 
        token.id.toLowerCase() === tokenOut.toLowerCase()
      );

      if (!tokenInInfo || !tokenOutInfo) return null;

      // Basic calculation (would need more complex math in real implementation)
      const tokenInBalance = parseFloat(tokenInInfo.balance);
      const tokenOutBalance = parseFloat(tokenOutInfo.balance);
      const amountInFloat = parseFloat(amountIn);
      
      // Simple constant product formula approximation
      const amountOut = (amountInFloat * tokenOutBalance) / (tokenInBalance + amountInFloat);

      return {
        pool: pool.name,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut: amountOut.toString(),
        poolAddress: pool.id
      };
    } catch (error) {
      console.error('Balancer swap rate error:', error);
      throw error;
    }
  },

  // Get weighted pools
  async getWeightedPools() {
    try {
      const pools = await this.getPools(50);
      return pools.filter(pool => 
        pool.tokens.some(token => token.weight && parseFloat(token.weight) > 0)
      );
    } catch (error) {
      console.error('Balancer weighted pools error:', error);
      throw error;
    }
  },

  // Get stable pools
  async getStablePools() {
    try {
      const pools = await this.getPools(50);
      return pools.filter(pool => 
        pool.name.toLowerCase().includes('stable') ||
        pool.name.toLowerCase().includes('usd') ||
        pool.tokens.every(token => 
          token.symbol.includes('USD') || 
          token.symbol.includes('USDC') || 
          token.symbol.includes('USDT') ||
          token.symbol.includes('DAI')
        )
      );
    } catch (error) {
      console.error('Balancer stable pools error:', error);
      throw error;
    }
  }
};
