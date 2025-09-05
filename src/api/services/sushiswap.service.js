import axios from 'axios';

/**
 * SushiSwap on Base API Service
 * Free tier: No API key needed, rate limited
 */

const SUSHI_API_BASE = 'https://api.sushi.com/v1';

export const sushiswapService = {
  // Get token price from SushiSwap
  async getTokenPrice(tokenAddress) {
    try {
      const { data } = await axios.get(`${SUSHI_API_BASE}/tokens/${tokenAddress}`);
      return data;
    } catch (error) {
      console.error('SushiSwap price fetch error:', error);
      throw error;
    }
  },

  // Get pool information
  async getPoolInfo(poolAddress) {
    try {
      const { data } = await axios.get(`${SUSHI_API_BASE}/pools/${poolAddress}`);
      return data;
    } catch (error) {
      console.error('SushiSwap pool info fetch error:', error);
      throw error;
    }
  },

  // Get top pools by volume
  async getTopPools(limit = 10) {
    try {
      const { data } = await axios.get(`${SUSHI_API_BASE}/pools?limit=${limit}`);
      return data || [];
    } catch (error) {
      console.error('SushiSwap top pools fetch error:', error);
      throw error;
    }
  },

  // Get swap rate estimate
  async getSwapRate(tokenIn, tokenOut, amountIn) {
    try {
      const { data } = await axios.get(`${SUSHI_API_BASE}/quote`, {
        params: {
          tokenIn,
          tokenOut,
          amountIn
        }
      });
      return data;
    } catch (error) {
      console.error('SushiSwap swap rate error:', error);
      throw error;
    }
  },

  // Get farming opportunities
  async getFarms() {
    try {
      const { data } = await axios.get(`${SUSHI_API_BASE}/farms`);
      return data || [];
    } catch (error) {
      console.error('SushiSwap farms fetch error:', error);
      throw error;
    }
  },

  // Get Sushi token info
  async getSushiTokenInfo() {
    try {
      const { data } = await axios.get(`${SUSHI_API_BASE}/tokens/sushi`);
      return data;
    } catch (error) {
      console.error('SushiSwap Sushi token error:', error);
      throw error;
    }
  }
};
