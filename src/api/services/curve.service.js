import axios from 'axios';

/**
 * Curve on Base API Service
 * Free tier: No API key needed, rate limited
 */

const CURVE_API_BASE = 'https://api.curve.fi/api';

export const curveService = {
  // Get pools on Base
  async getPools() {
    try {
      const { data } = await axios.get(`${CURVE_API_BASE}/getPools/base`);
      return data.data?.poolData || [];
    } catch (error) {
      console.error('Curve pools fetch error:', error);
      throw error;
    }
  },

  // Get specific pool info
  async getPoolInfo(poolAddress) {
    try {
      const pools = await this.getPools();
      const pool = pools.find(p => p.address.toLowerCase() === poolAddress.toLowerCase());
      return pool;
    } catch (error) {
      console.error('Curve pool info fetch error:', error);
      throw error;
    }
  },

  // Get stablecoin swap rates
  async getStablecoinRates() {
    try {
      const pools = await this.getPools();
      const stablecoinPools = pools.filter(pool => 
        pool.name.toLowerCase().includes('stable') ||
        pool.name.toLowerCase().includes('usd') ||
        pool.name.toLowerCase().includes('3pool')
      );
      return stablecoinPools;
    } catch (error) {
      console.error('Curve stablecoin rates error:', error);
      throw error;
    }
  },

  // Get swap rate estimate
  async getSwapRate(poolAddress, tokenIn, tokenOut, amountIn) {
    try {
      const pool = await this.getPoolInfo(poolAddress);
      if (!pool) return null;

      // Find token indices
      const tokenInIndex = pool.coins.findIndex(coin => 
        coin.address.toLowerCase() === tokenIn.toLowerCase()
      );
      const tokenOutIndex = pool.coins.findIndex(coin => 
        coin.address.toLowerCase() === tokenOut.toLowerCase()
      );

      if (tokenInIndex === -1 || tokenOutIndex === -1) return null;

      // This would require more complex calculation in a real implementation
      // For now, return basic pool info
      return {
        pool: pool.name,
        tokenIn,
        tokenOut,
        amountIn,
        estimatedAmountOut: '0', // Would need actual calculation
        poolAddress: pool.address
      };
    } catch (error) {
      console.error('Curve swap rate error:', error);
      throw error;
    }
  },

  // Get Curve token (CRV) info
  async getCurveTokenInfo() {
    try {
      const { data } = await axios.get(`${CURVE_API_BASE}/getTokenInfo/CRV`);
      return data;
    } catch (error) {
      console.error('Curve token info error:', error);
      throw error;
    }
  },

  // Get yield farming opportunities
  async getFarms() {
    try {
      const { data } = await axios.get(`${CURVE_API_BASE}/getFarms/base`);
      return data.data || [];
    } catch (error) {
      console.error('Curve farms fetch error:', error);
      throw error;
    }
  }
};
