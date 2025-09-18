import axios from 'axios';
import CryptoJS from 'crypto-js';
import { config } from '../config/config.js';

/**
 * OKX DEX Controller
 * Handles OKX DEX aggregator API calls with secure credentials
 */
class OKXController {
  constructor() {
    this.baseURL = config.okxDexBaseUrl;
    this.apiKey = config.okxApiKey;
    this.secretKey = config.okxSecretKey;
    this.passphrase = config.okxPassphrase;
    // Olivia Labs API integration
    this.oliviaLabsApiKey = config.oliviaLabsApiKey;
  }

  /**
   * Generate authentication signature for OKX API
   */
  generateSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, this.secretKey));
  }

  /**
   * Create authenticated headers for OKX API requests
   */
  createHeaders(method, requestPath, body = '') {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(timestamp, method, requestPath, body);

    return {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json'
    };
  }

  /**
   * GET /api/okx/chains - Get supported chains/networks
   */
  async getSupportedChains(req, res) {
    try {
      const requestPath = '/supported/chain';
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🔗 OKX: Supported chains fetched');
      res.json({
        success: true,
        chains: response.data.data || []
      });
    } catch (error) {
      console.error('🔗 OKX: Failed to fetch supported chains:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/quote - Get quote for token swap
   * Query params: chainId, fromTokenAddress, toTokenAddress, amount, slippage (optional)
   */
  async getQuote(req, res) {
    try {
      const { chainId, fromTokenAddress, toTokenAddress, amount, slippage = 0.5 } = req.query;
      
      if (!chainId || !fromTokenAddress || !toTokenAddress || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: chainId, fromTokenAddress, toTokenAddress, amount'
        });
      }

      const requestPath = `/quote?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('💱 OKX: Quote fetched', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount
      });

      res.json({
        success: true,
        quote: response.data.data
      });
    } catch (error) {
      console.error('💱 OKX: Failed to fetch quote:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/swap - Get swap transaction data
   * Query params: chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress, slippage (optional)
   */
  async getSwapData(req, res) {
    try {
      const { chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress, slippage = 0.5 } = req.query;
      
      if (!chainId || !fromTokenAddress || !toTokenAddress || !amount || !userWalletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress'
        });
      }

      const requestPath = `/swap?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&userWalletAddress=${userWalletAddress}&slippage=${slippage}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🔄 OKX: Swap data generated', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount,
        userWallet: userWalletAddress
      });

      res.json({
        success: true,
        swapData: response.data.data
      });
    } catch (error) {
      console.error('🔄 OKX: Failed to generate swap data:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/tokens - Get token list for a specific chain
   * Query params: chainId
   */
  async getTokens(req, res) {
    try {
      const { chainId } = req.query;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: chainId'
        });
      }

      const requestPath = `/tokens?chainId=${chainId}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🪙 OKX: Tokens fetched for chain', chainId);
      res.json({
        success: true,
        tokens: response.data.data || []
      });
    } catch (error) {
      console.error('🪙 OKX: Failed to fetch tokens:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/popular-pairs - Get popular trading pairs for quick access
   * Query params: chainId (optional, defaults to '1')
   */
  async getPopularPairs(req, res) {
    try {
      const { chainId = '1' } = req.query;
      
      // Common token addresses (Ethereum mainnet)
      const popularTokens = {
        '1': { // Ethereum
          'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          'USDC': '0xA0b86a33E6441d41Bce2C2c8d6c4e7c14e8c2b8',
          'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        }
      };

      res.json({
        success: true,
        pairs: popularTokens[chainId] || {}
      });
    } catch (error) {
      console.error('🔗 OKX: Failed to get popular pairs:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/okx/olivia-quote - Olivia AI Integration: Get best quote with personality
   * Body: { fromToken, toToken, amount, chainId (optional) }
   */
  async getOliviaQuote(req, res) {
    try {
      const { fromToken, toToken, amount, chainId = '1' } = req.body;
      
      if (!fromToken || !toToken || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: fromToken, toToken, amount'
        });
      }

      console.log('🤖 Olivia: Getting quote for', { fromToken, toToken, amount, chainId });
      
      // Get token addresses (this would need to be expanded with a proper token registry)
      const popularPairsResponse = await this.getPopularPairs({ query: { chainId } }, { json: (data) => data });
      const tokenPairs = popularPairsResponse;
      const fromTokenAddress = tokenPairs.pairs[fromToken.toUpperCase()];
      const toTokenAddress = tokenPairs.pairs[toToken.toUpperCase()];

      if (!fromTokenAddress || !toTokenAddress) {
        return res.json({
          success: false,
          oliviaMessage: `Hold up! I don't recognize one of those tokens. Try something popular like USDT, USDC, or WETH. 🤔`,
          error: 'Token not found in registry'
        });
      }

      // Format amount (assuming 18 decimals for now - this should be dynamic)
      const formattedAmount = this.formatTokenAmount(amount, 18);
      
      const requestPath = `/quote?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${formattedAmount}&slippage=0.5`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      const quote = response.data.data;

      const outputAmount = this.parseTokenAmount(quote.toTokenAmount, 18);
      const rate = (parseFloat(outputAmount) / amount).toFixed(6);
      
      res.json({
        success: true,
        quote,
        oliviaMessage: `Alright, I found you a sweet deal! ${amount} ${fromToken} gets you ${outputAmount} ${toToken} - that's a rate of ${rate}. Want me to execute this trade? 😏`,
        details: {
          fromAmount: amount,
          fromToken,
          toAmount: outputAmount,
          toToken,
          rate,
          gasEstimate: quote.estimatedGas
        }
      });
    } catch (error) {
      console.error('🤖 Olivia: Quote error:', error);
      
      // Check if it's a geo-blocking error
      if (error.response?.data?.msg && error.response.data.msg.includes('local regulations')) {
        return res.json({
          success: false,
          oliviaMessage: `Ugh, looks like OKX is geo-blocked in your area. Those pesky regulations are cramping my style! 🙄 I need to set up a different DEX aggregator for your region. Give me a sec to work on that... 🔧`,
          error: 'geo_blocked'
        });
      }
      
      res.json({
        success: false,
        oliviaMessage: `Ugh, something went wrong getting that quote. The DEX gods aren't cooperating right now. Try again in a sec? 🙄`,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * Helper: Format token amount from human readable to contract units
   */
  formatTokenAmount(amount, decimals) {
    const amountBN = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(amountBN).toString();
  }

  /**
   * Helper: Format token amount from contract units to human readable
   */
  parseTokenAmount(amount, decimals) {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
  }

  /**
   * GET /api/okx/token-holders - Get top token holders
   * Query params: chainId, tokenContractAddress
   */
  async getTokenHolders(req, res) {
    try {
      const { chainId, tokenContractAddress } = req.query;
      
      if (!chainId || !tokenContractAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: chainId, tokenContractAddress'
        });
      }

      const requestPath = `/market/token/holder?chainIndex=${chainId}&tokenContractAddress=${tokenContractAddress}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`https://web3.okx.com/api/v5/dex${requestPath}`, { headers });
      
      console.log('👥 OKX: Token holders fetched', {
        token: tokenContractAddress,
        chain: chainId,
        holdersCount: response.data.data?.length || 0
      });

      res.json({
        success: true,
        data: response.data.data,
        token: tokenContractAddress,
        chainId: chainId
      });
    } catch (error) {
      console.error('👥 OKX: Failed to fetch token holders:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * POST /api/okx/token-holders-query - Get token holders with AI parsing
   * Body: { userQuery }
   */
  async getTokenHoldersQuery(req, res) {
    try {
      const { userQuery } = req.body;
      
      if (!userQuery) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: userQuery'
        });
      }

      console.log('🤖 Olivia: Getting token holders for query:', userQuery);
      
      // Enhanced token extraction with common token mapping
      const tokenPattern = /\b([A-Z]{2,10}|0x[a-fA-F0-9]{40})\b/g;
      const matches = userQuery.match(tokenPattern);
      
      if (!matches) {
        return res.json({
          success: false,
          oliviaMessage: `I need a token symbol or contract address to show you the top holders! Try something like "PEPE" or "ETH" 🔍`,
          error: 'No token found in query'
        });
      }

      const token = matches[0].toUpperCase();
      
      // Token to contract address mapping for major tokens
      const tokenContracts = {
        'PEPE': '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'SHIB': '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
        'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        'MATIC': '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        'CRO': '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      };

      const contractAddress = tokenContracts[token];
      
      if (!contractAddress) {
        return res.json({
          success: false,
          oliviaMessage: `I found ${token} but don't have its contract address in my database yet. I currently support: ${Object.keys(tokenContracts).join(', ')}`,
          error: 'Contract address not found',
          token: token,
          supportedTokens: Object.keys(tokenContracts)
        });
      }
      
      try {
        console.log(`👥 OKX: Fetching holders for ${token} with contract ${contractAddress}`);
        const requestPath = `/market/token/holder?chainIndex=1&tokenContractAddress=${contractAddress}`;
        const headers = this.createHeaders('GET', requestPath);
        
        const response = await axios.get(`https://web3.okx.com/api/v5/dex${requestPath}`, { headers });
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          console.log('👥 OKX: Real holder data fetched for', token);
          
          // Format the top 5 holders
          const topHolders = response.data.data.slice(0, 5).map((holder, index) => ({
            rank: index + 1,
            address: holder.holderWalletAddress,
            amount: holder.holdAmount,
            shortAddress: `${holder.holderWalletAddress.slice(0, 6)}...${holder.holderWalletAddress.slice(-4)}`
          }));
          
          return res.json({
            success: true,
            data: response.data.data,
            topHolders: topHolders,
            token: token,
            chainId: "1",
            contractAddress: contractAddress,
            oliviaMessage: `Here are the top ${token} holders! 🐋 Real data from OKX DEX API:\n\nThese whales control the biggest bags. Watch for their movements!`,
            details: {
              totalHolders: response.data.data.length,
              topHolderAmount: response.data.data[0]?.holdAmount || 'Unknown',
              blockchain: 'Ethereum',
              analysisNote: "Real holder distribution data from OKX DEX API"
            }
          });
        } else {
          throw new Error('No holder data returned from OKX API');
        }
      } catch (error) {
        console.log('🚨 OKX API call failed:', error.response?.data?.msg || error.message);
        console.log('🚨 Full error:', error.response?.data || error.message);
        
        return res.json({
          success: false,
          oliviaMessage: `I tried to get ${token} holder data from OKX but the API is currently unavailable (possibly geo-blocked). The contract address is ${contractAddress} on Ethereum.`,
          error: 'OKX API unavailable',
          token: token,
          contractAddress: contractAddress,
          apiError: error.response?.data?.msg || error.message
        });
      }
    } catch (error) {
      console.error('🤖 Olivia: Token holders query error:', error);
      
      res.json({
        success: false,
        oliviaMessage: `Oops! I ran into trouble fetching those holder details. The blockchain data gods aren't cooperating right now 😅 Try again in a moment!`,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/olivia-labs - Enhanced OKX data via Olivia Labs API
   */
  async getOliviaLabsData(req, res) {
    try {
      if (!this.oliviaLabsApiKey) {
        return res.status(400).json({
          success: false,
          error: 'Olivia Labs API key not configured'
        });
      }

      const { token, pair, action } = req.query;
      
      // Example Olivia Labs API call for enhanced OKX data
      const response = await axios.get('https://api.olivialabs.io/v1/okx/enhanced', {
        headers: {
          'Authorization': `Bearer ${this.oliviaLabsApiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          token,
          pair,
          action
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
        source: 'Olivia Labs'
      });

    } catch (error) {
      console.error('Olivia Labs OKX API error:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.message || 'Failed to fetch Olivia Labs data',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const okxController = new OKXController();
