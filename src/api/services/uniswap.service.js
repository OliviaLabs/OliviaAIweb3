import axios from 'axios';

/**
 * Uniswap V3 on Base API Service
 * Free tier: No API key needed, rate limited
 */

const UNISWAP_V3_BASE_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base';

export const uniswapService = {
  // Get token price from Uniswap V3
  async getTokenPrice(tokenAddress) {
    try {
      const query = `
        query GetTokenPrice($tokenAddress: String!) {
          token(id: $tokenAddress) {
            id
            symbol
            name
            decimals
            derivedETH
            totalValueLockedUSD
            volumeUSD
            txCount
          }
        }
      `;
      
      const { data } = await axios.post(UNISWAP_V3_BASE_SUBGRAPH, {
        query,
        variables: { tokenAddress: tokenAddress.toLowerCase() }
      });
      
      return data.data?.token;
    } catch (error) {
      console.error('Uniswap V3 price fetch error:', error);
      throw error;
    }
  },

  // Get pool information
  async getPoolInfo(poolAddress) {
    try {
      const query = `
        query GetPoolInfo($poolAddress: String!) {
          pool(id: $poolAddress) {
            id
            token0 {
              id
              symbol
              name
              decimals
            }
            token1 {
              id
              symbol
              name
              decimals
            }
            feeTier
            liquidity
            sqrtPrice
            tick
            token0Price
            token1Price
            volumeUSD
            txCount
            totalValueLockedUSD
          }
        }
      `;
      
      const { data } = await axios.post(UNISWAP_V3_BASE_SUBGRAPH, {
        query,
        variables: { poolAddress: poolAddress.toLowerCase() }
      });
      
      return data.data?.pool;
    } catch (error) {
      console.error('Uniswap V3 pool info fetch error:', error);
      throw error;
    }
  },

  // Get top pools by volume
  async getTopPools(limit = 10) {
    try {
      const query = `
        query GetTopPools($limit: Int!) {
          pools(
            first: $limit
            orderBy: volumeUSD
            orderDirection: desc
            where: { volumeUSD_gt: "0" }
          ) {
            id
            token0 {
              symbol
              name
            }
            token1 {
              symbol
              name
            }
            feeTier
            volumeUSD
            totalValueLockedUSD
            token0Price
            token1Price
          }
        }
      `;
      
      const { data } = await axios.post(UNISWAP_V3_BASE_SUBGRAPH, {
        query,
        variables: { limit }
      });
      
      return data.data?.pools || [];
    } catch (error) {
      console.error('Uniswap V3 top pools fetch error:', error);
      throw error;
    }
  },

  // Get swap rate estimate
  async getSwapRate(tokenIn, tokenOut, amountIn, poolFee = 3000) {
    try {
      // This would typically require a more complex calculation
      // For now, return basic pool info
      const pools = await this.getTopPools(50);
      const relevantPool = pools.find(pool => 
        (pool.token0.id.toLowerCase() === tokenIn.toLowerCase() && 
         pool.token1.id.toLowerCase() === tokenOut.toLowerCase()) ||
        (pool.token0.id.toLowerCase() === tokenOut.toLowerCase() && 
         pool.token1.id.toLowerCase() === tokenIn.toLowerCase())
      );
      
      if (relevantPool) {
        const isToken0 = relevantPool.token0.id.toLowerCase() === tokenIn.toLowerCase();
        const price = isToken0 ? relevantPool.token0Price : relevantPool.token1Price;
        const amountOut = parseFloat(amountIn) * parseFloat(price);
        
        return {
          tokenIn,
          tokenOut,
          amountIn,
          amountOut: amountOut.toString(),
          price: price.toString(),
          pool: relevantPool.id
        };
      }
      
      return null;
    } catch (error) {
      console.error('Uniswap V3 swap rate error:', error);
      throw error;
    }
  },

  // Get ETH price (for converting to USD)
  async getETHPrice() {
    try {
      const query = `
        query GetETHPrice {
          bundle(id: "1") {
            ethPriceUSD
          }
        }
      `;
      
      const { data } = await axios.post(UNISWAP_V3_BASE_SUBGRAPH, {
        query
      });
      
      return data.data?.bundle?.ethPriceUSD;
    } catch (error) {
      console.error('Uniswap V3 ETH price error:', error);
      throw error;
    }
  }
};
