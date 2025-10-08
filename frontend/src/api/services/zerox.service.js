import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

export const zeroXService = {
  // Get swap quote from 0x Protocol
  async getSwapQuote(sellToken, buyToken, sellAmount = null, buyAmount = null, takerAddress = null, slippagePercentage = null) {
    try {
      const params = new URLSearchParams({
        sellToken: sellToken.toUpperCase(),
        buyToken: buyToken.toUpperCase()
      });

      if (sellAmount) params.append('sellAmount', sellAmount);
      if (buyAmount) params.append('buyAmount', buyAmount);
      if (takerAddress) params.append('takerAddress', takerAddress);
      if (slippagePercentage) params.append('slippagePercentage', slippagePercentage);

      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/zerox/quote?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { result: data.success ? data.data : data };
    } catch (error) {
      console.error('0x Protocol swap quote fetch error:', error);
      throw error;
    }
  },

  // Get swap price (lighter version of quote)
  async getSwapPrice(sellToken, buyToken, sellAmount = null, buyAmount = null) {
    try {
      const params = new URLSearchParams({
        sellToken: sellToken.toUpperCase(),
        buyToken: buyToken.toUpperCase()
      });

      if (sellAmount) params.append('sellAmount', sellAmount);
      if (buyAmount) params.append('buyAmount', buyAmount);

      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/zerox/price?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('0x Protocol swap price fetch error:', error);
      throw error;
    }
  },

  // Get list of supported tokens
  async getTokens() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/zerox/tokens`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { result: data.success ? data.data : data };
    } catch (error) {
      console.error('0x Protocol tokens fetch error:', error);
      throw error;
    }
  },

  // Get current gas price estimates
  async getGasPrice() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/zerox/gas-price`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('0x Protocol gas price fetch error:', error);
      throw error;
    }
  },

  // Get order book for a token pair
  async getOrderBook(baseToken, quoteToken, perPage = 20) {
    try {
      const params = new URLSearchParams({
        baseToken: baseToken.toUpperCase(),
        quoteToken: quoteToken.toUpperCase(),
        perPage: perPage.toString()
      });

      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/zerox/orderbook?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { result: data.success ? data.data : data };
    } catch (error) {
      console.error('0x Protocol order book fetch error:', error);
      throw error;
    }
  },

  // Helper function to convert token amount to base units (wei equivalent)
  convertToBaseUnits(amount, decimals = 18) {
    try {
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      return amountBigInt.toString();
    } catch (error) {
      console.error('Error converting to base units:', error);
      throw new Error('Invalid amount or decimals');
    }
  },

  // Helper function to convert from base units to human readable
  convertFromBaseUnits(amount, decimals = 18) {
    try {
      const amountBigInt = BigInt(amount);
      const divisor = BigInt(Math.pow(10, decimals));
      const wholePart = amountBigInt / divisor;
      const fractionalPart = amountBigInt % divisor;
      return parseFloat(`${wholePart}.${fractionalPart.toString().padStart(decimals, '0')}`);
    } catch (error) {
      console.error('Error converting from base units:', error);
      throw new Error('Invalid amount or decimals');
    }
  },

  // Get popular token pairs for UI
  getPopularTokenPairs() {
    return [
      { sellToken: 'ETH', buyToken: 'USDC', name: 'ETH → USDC' },
      { sellToken: 'USDC', buyToken: 'ETH', name: 'USDC → ETH' },
      { sellToken: 'WETH', buyToken: 'DAI', name: 'WETH → DAI' },
      { sellToken: 'DAI', buyToken: 'WETH', name: 'DAI → WETH' },
      { sellToken: 'USDC', buyToken: 'DAI', name: 'USDC → DAI' },
      { sellToken: 'DAI', buyToken: 'USDC', name: 'DAI → USDC' },
      { sellToken: 'WETH', buyToken: 'UNI', name: 'WETH → UNI' },
      { sellToken: 'UNI', buyToken: 'WETH', name: 'UNI → WETH' }
    ];
  }
};