import https from 'https';
import { URL } from 'url';

export class BinanceMCPClient {
  static baseURL = 'https://api.binance.com/api/v3';

  static async makeRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.baseURL + endpoint);
        Object.keys(params).forEach(key => {
          if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
          }
        });

        console.log(`🔗 [Binance API] Calling: ${url.toString()}`);

        const request = https.get(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
          }
        }, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => {
            try {
              if (response.statusCode !== 200) {
                throw new Error(`HTTP error! status: ${response.statusCode}`);
              }
              const jsonData = JSON.parse(data);
              console.log(`✅ [Binance API] Request successful`);
              resolve(jsonData);
            } catch (parseError) {
              console.error(`❌ [Binance API] Parse error:`, parseError.message);
              reject(parseError);
            }
          });
        });
        request.on('error', (error) => {
          console.error(`❌ [Binance API] Request failed:`, error.message);
          reject(error);
        });
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('Request timeout'));
        });
      } catch (error) {
        console.error(`❌ [Binance API] Request failed:`, error.message);
        reject(error);
      }
    });
  }

  static async getPrice(symbol) {
    return this.makeRequest('/ticker/price', { symbol });
  }

  static async get24hrTicker(symbol) {
    return this.makeRequest('/ticker/24hr', { symbol });
  }

  static async getOrderBook(symbol, limit = 100) {
    return this.makeRequest('/depth', { symbol, limit });
  }

  static async getRecentTrades(symbol, limit = 500) {
    return this.makeRequest('/trades', { symbol, limit });
  }

  static async getHistoricalTrades(symbol, limit = 500, fromId) {
    const params = { symbol, limit };
    if (fromId) params.fromId = fromId;
    return this.makeRequest('/historicalTrades', params);
  }

  static async getAggregateTrades(symbol, limit = 500, fromId, startTime, endTime) {
    const params = { symbol, limit };
    if (fromId) params.fromId = fromId;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    return this.makeRequest('/aggTrades', params);
  }

  static async getKlines(symbol, interval = '1h', limit = 500, startTime, endTime) {
    const params = { symbol, interval, limit };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    return this.makeRequest('/klines', params);
  }

  static async getUIKlines(symbol, interval = '1h', limit = 500, startTime, endTime) {
    const params = { symbol, interval, limit };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    return this.makeRequest('/uiKlines', params);
  }

  static async getAvgPrice(symbol) {
    return this.makeRequest('/avgPrice', { symbol });
  }

  static async getTradingDayTicker(symbol) {
    return this.makeRequest('/ticker', { symbol });
  }

  static async getBookTicker(symbol) {
    return this.makeRequest('/ticker/bookTicker', { symbol });
  }

  static async getRollingWindowTicker(symbol, windowSize = '1d', type = 'FULL') {
    return this.makeRequest('/ticker', { symbol, windowSize, type });
  }
}
