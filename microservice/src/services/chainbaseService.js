import axios from 'axios';

class ChainbaseService {
  constructor() {
    this.apiKey = '32qQPjW0FSVQmQPpk7yvVVyDOuE';
    this.baseURL = 'https://api.chainbase.online/v1';
    this.headers = {
      'x-api-key': this.apiKey,
      'accept': 'application/json'
    };
  }

  // Get latest block number - REAL Chainbase endpoint
  async getLatestBlockNumber(chainId) {
    try {
      const response = await axios.get(`${this.baseURL}/block/number/latest`, {
        headers: this.headers,
        params: {
          chain_id: chainId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get block by number - REAL Chainbase endpoint
  async getBlockByNumber(chainId, blockNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/block/detail/${blockNumber}`, {
        headers: this.headers,
        params: {
          chain_id: chainId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get transaction data
  async getTransactions(chainId, address = null, limit = 10) {
    try {
      const params = {
        chain_id: chainId,
        limit: limit
      };
      
      if (address) {
        params.address = address;
      }

      const response = await axios.get(`${this.baseURL}/transactions`, {
        headers: this.headers,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get token data
  async getTokenData(chainId, tokenAddress = null, limit = 10) {
    try {
      const params = {
        chain_id: chainId,
        limit: limit
      };
      
      if (tokenAddress) {
        params.token_address = tokenAddress;
      }

      const response = await axios.get(`${this.baseURL}/tokens`, {
        headers: this.headers,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get supported chains
  async getSupportedChains() {
    try {
      const response = await axios.get(`${this.baseURL}/chains`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get network statistics
  async getNetworkStats(chainId) {
    try {
      const response = await axios.get(`${this.baseURL}/stats`, {
        headers: this.headers,
        params: {
          chain_id: chainId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get account balance - Real Chainbase endpoint
  async getAccountBalance(chainId, address) {
    try {
      const response = await axios.get(`${this.baseURL}/account/balances`, {
        headers: this.headers,
        params: {
          chain_id: chainId,
          address: address,
          limit: 20
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get token price - REAL Chainbase endpoint
  async getTokenPrice(chainId, contractAddress) {
    try {
      const response = await axios.get(`${this.baseURL}/token/price`, {
        headers: this.headers,
        params: {
          chain_id: chainId,
          contract_address: contractAddress
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get token price history - REAL Chainbase endpoint
  async getTokenPriceHistory(chainId, contractAddress, fromTimestamp, endTimestamp) {
    try {
      const response = await axios.get(`${this.baseURL}/token/price/history`, {
        headers: this.headers,
        params: {
          chain_id: chainId,
          contract_address: contractAddress,
          from_timestamp: fromTimestamp,
          end_timestamp: endTimestamp
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get block by number
  async getBlock(chainId, blockNumber = 'latest') {
    try {
      const response = await axios.post(`${this.baseURL}`, {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, false]
      }, {
        headers: this.headers,
        params: {
          chain_id: chainId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get NFT data
  async getNFTData(chainId, contractAddress = null, limit = 10) {
    try {
      const params = {
        chain_id: chainId,
        limit: limit
      };
      
      if (contractAddress) {
        params.contract_address = contractAddress;
      }

      const response = await axios.get(`${this.baseURL}/nfts`, {
        headers: this.headers,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get DeFi protocol data
  async getDeFiData(chainId, protocol = null) {
    try {
      const params = {
        chain_id: chainId
      };
      
      if (protocol) {
        params.protocol = protocol;
      }

      const response = await axios.get(`${this.baseURL}/defi`, {
        headers: this.headers,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get cross-chain data
  async getCrossChainData(fromChainId, toChainId) {
    try {
      const response = await axios.get(`${this.baseURL}/cross-chain`, {
        headers: this.headers,
        params: {
          from_chain_id: fromChainId,
          to_chain_id: toChainId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Chainbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ChainbaseService();
