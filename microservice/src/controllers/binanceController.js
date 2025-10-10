import { BinanceMCPClient } from '../services/binanceMCPClient.js';

export class BinanceController {
  static async getPrice(req, res) {
    try {
      const { symbol } = req.query;
      console.log(`📊 [Binance Controller] getPrice called with symbol: ${symbol}`);
      if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol is required (e.g., BTCUSDT)', code: 'MISSING_SYMBOL' });
      }
      console.log(`📊 [Binance Controller] Getting price for: ${symbol}`);
      const price = await BinanceMCPClient.getPrice(symbol);
      res.json({ success: true, data: price, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [Binance Controller] getPrice error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch price', code: 'BINANCE_PRICE_ERROR' });
    }
  }

  static async get24hrTicker(req, res) {
    try {
      const { symbol } = req.query;
      console.log(`📊 [Binance Controller] get24hrTicker called with symbol: ${symbol}`);
      if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol is required (e.g., BTCUSDT)', code: 'MISSING_SYMBOL' });
      }
      console.log(`📊 [Binance Controller] Getting 24hr ticker for: ${symbol}`);
      const ticker = await BinanceMCPClient.get24hrTicker(symbol);
      res.json({ success: true, data: ticker, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [Binance Controller] get24hrTicker error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch 24hr ticker', code: 'BINANCE_TICKER_ERROR' });
    }
  }

  static async getOrderBook(req, res) {
    try {
      const { symbol, limit = 100 } = req.query;
      console.log(`📊 [Binance Controller] getOrderBook called with symbol: ${symbol}, limit: ${limit}`);
      if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol is required (e.g., BTCUSDT)', code: 'MISSING_SYMBOL' });
      }
      const orderBook = await BinanceMCPClient.getOrderBook(symbol, parseInt(limit));
      res.json({ success: true, data: orderBook, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [Binance Controller] getOrderBook error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch order book', code: 'BINANCE_ORDERBOOK_ERROR' });
    }
  }

  static async getRecentTrades(req, res) {
    try {
      const { symbol, limit = 500 } = req.query;
      console.log(`📊 [Binance Controller] getRecentTrades called with symbol: ${symbol}, limit: ${limit}`);
      if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol is required (e.g., BTCUSDT)', code: 'MISSING_SYMBOL' });
      }
      const trades = await BinanceMCPClient.getRecentTrades(symbol, parseInt(limit));
      res.json({ success: true, data: trades, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [Binance Controller] getRecentTrades error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch recent trades', code: 'BINANCE_TRADES_ERROR' });
    }
  }

  static async getKlines(req, res) {
    try {
      const { symbol, interval = '1h', limit = 500, startTime, endTime } = req.query;
      console.log(`📊 [Binance Controller] getKlines called with symbol: ${symbol}, interval: ${interval}`);
      if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol is required (e.g., BTCUSDT)', code: 'MISSING_SYMBOL' });
      }
      const klines = await BinanceMCPClient.getKlines(symbol, interval, parseInt(limit), startTime, endTime);
      res.json({ success: true, data: klines, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [Binance Controller] getKlines error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch klines', code: 'BINANCE_KLINES_ERROR' });
    }
  }
}
