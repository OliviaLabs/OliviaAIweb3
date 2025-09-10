const axios = require('axios');

class CoinGeckoController {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
  }

  async getPrice(req, res) {
    try {
      const { ids, vs_currencies } = req.query;
      
      if (!ids || !vs_currencies) {
        return res.status(400).json({ 
          error: 'Missing required parameters: ids and vs_currencies' 
        });
      }

      const url = `${this.baseURL}/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`;
      
      console.log(`🪙 CoinGecko API call: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OliviaAI-Microservice/1.0'
        }
      });

      console.log(`✅ CoinGecko response:`, response.data);
      
      res.json(response.data);
    } catch (error) {
      console.error('❌ CoinGecko API error:', error.message);
      
      if (error.response) {
        // API responded with error status
        res.status(error.response.status).json({
          error: 'CoinGecko API error',
          status: error.response.status,
          message: error.response.data?.error || error.message
        });
      } else if (error.request) {
        // Request was made but no response received
        res.status(503).json({
          error: 'CoinGecko API unavailable',
          message: 'No response received from CoinGecko'
        });
      } else {
        // Something else happened
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    }
  }

  async searchCoins(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ 
          error: 'Missing required parameter: query' 
        });
      }

      const url = `${this.baseURL}/search?query=${encodeURIComponent(query)}`;
      
      console.log(`🔍 CoinGecko search: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OliviaAI-Microservice/1.0'
        }
      });

      console.log(`✅ CoinGecko search response:`, response.data);
      
      res.json(response.data);
    } catch (error) {
      console.error('❌ CoinGecko search error:', error.message);
      
      if (error.response) {
        res.status(error.response.status).json({
          error: 'CoinGecko search error',
          status: error.response.status,
          message: error.response.data?.error || error.message
        });
      } else if (error.request) {
        res.status(503).json({
          error: 'CoinGecko API unavailable',
          message: 'No response received from CoinGecko'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    }
  }
}

module.exports = new CoinGeckoController();
