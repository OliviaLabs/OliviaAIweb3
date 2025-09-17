import axios from 'axios';

/**
 * TON Center API Service
 * Provides access to TON blockchain data via TON Center API v2
 */
class TONCenterService {
  constructor() {
    this.baseURL = 'https://toncenter.com/api/v2';
    this.apiKey = process.env.TON_CENTER_API_KEY; // Optional API key for higher rate limits
  }

  /**
   * Create headers for TON Center API requests
   */
  createHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use API key if provided (FREE tier: 1 RPS, 10/second total)
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    return headers;
  }

  /**
   * Get account information by address
   */
  async getAccountInfo(address) {
    try {
      const response = await axios.get(`${this.baseURL}/getAddressInformation`, {
        headers: this.createHeaders(),
        params: { address }
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get account info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address) {
    try {
      const response = await axios.get(`${this.baseURL}/getAddressBalance`, {
        headers: this.createHeaders(),
        params: { address }
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get account balance:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(address, limit = 10, lt = null, hash = null) {
    try {
      const params = { address, limit };
      if (lt) params.lt = lt;
      if (hash) params.hash = hash;

      const response = await axios.get(`${this.baseURL}/getTransactions`, {
        headers: this.createHeaders(),
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get account transactions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get jetton (token) balances for an account
   */
  async getJettonBalances(address) {
    try {
      const response = await axios.get(`${this.baseURL}/getJettons`, {
        headers: this.createHeaders(),
        params: { address }
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get jetton balances:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get jetton information by address
   */
  async getJettonInfo(jettonAddress) {
    try {
      const response = await axios.get(`${this.baseURL}/getJettonInfo`, {
        headers: this.createHeaders(),
        params: { address: jettonAddress }
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get jetton info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get masterchain info
   */
  async getMasterchainInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/getMasterchainInfo`, {
        headers: this.createHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get masterchain info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Run get method on a smart contract
   */
  async runGetMethod(address, method, stack = []) {
    try {
      const response = await axios.post(`${this.baseURL}/runGetMethod`, {
        address,
        method,
        stack
      }, {
        headers: this.createHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to run get method:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get popular jettons (tokens)
   * Note: TON Center API doesn't have a popular jettons endpoint
   * Returning well-known TON jettons instead
   */
  async getPopularJettons() {
    try {
      // Return hardcoded popular TON jettons
      const popularJettons = [
        { symbol: 'USDT', name: 'Tether USD on TON' },
        { symbol: 'NOT', name: 'Notcoin' },
        { symbol: 'jUSDT', name: 'JustStable USDT' },
        { symbol: 'jUSDC', name: 'JustStable USDC' },
        { symbol: 'SCALE', name: 'Scaleton' }
      ];
      
      return {
        success: true,
        jettons: popularJettons
      };
    } catch (error) {
      console.error('TON Center: Error in getPopularJettons:', error.message);
      return {
        success: false,
        jettons: []
      };
    }
  }

  /**
   * Get TON price in USD
   */
  async getTONPrice() {
    try {
      const response = await axios.get(`${this.baseURL}/getTokenPrice`, {
        headers: this.createHeaders(),
        params: { token: 'TON' }
      });
      
      return response.data;
    } catch (error) {
      console.error('TON Center: Failed to get TON price:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const tonCenterService = new TONCenterService();
