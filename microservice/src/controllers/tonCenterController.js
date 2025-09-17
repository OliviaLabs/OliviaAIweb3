import { tonCenterService } from '../services/tonCenterService.js';

/**
 * TON Center Controller
 * Handles TON blockchain data requests via TON Center API
 */
class TONCenterController {
  /**
   * GET /api/ton/account/:address - Get account information
   */
  async getAccountInfo(req, res) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required'
        });
      }

      const accountInfo = await tonCenterService.getAccountInfo(address);
      
      console.log('🔗 TON Center: Account info fetched for', address);
      
      res.json({
        success: true,
        data: accountInfo
      });
    } catch (error) {
      console.error('🔗 TON Center: Failed to get account info:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get account information',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/balance/:address - Get account balance
   */
  async getAccountBalance(req, res) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required'
        });
      }

      const balance = await tonCenterService.getAccountBalance(address);
      
      console.log('💰 TON Center: Balance fetched for', address);
      
      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('💰 TON Center: Failed to get account balance:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get account balance',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/transactions/:address - Get account transactions
   */
  async getAccountTransactions(req, res) {
    try {
      const { address } = req.params;
      const { limit = 10, lt, hash } = req.query;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required'
        });
      }

      const transactions = await tonCenterService.getAccountTransactions(address, parseInt(limit), lt, hash);
      
      console.log('📝 TON Center: Transactions fetched for', address);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('📝 TON Center: Failed to get account transactions:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get account transactions',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/jettons/:address - Get jetton balances
   */
  async getJettonBalances(req, res) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required'
        });
      }

      const jettons = await tonCenterService.getJettonBalances(address);
      
      console.log('🪙 TON Center: Jetton balances fetched for', address);
      
      res.json({
        success: true,
        data: jettons
      });
    } catch (error) {
      console.error('🪙 TON Center: Failed to get jetton balances:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get jetton balances',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/jetton-info/:address - Get jetton information
   */
  async getJettonInfo(req, res) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Jetton address parameter is required'
        });
      }

      const jettonInfo = await tonCenterService.getJettonInfo(address);
      
      console.log('🪙 TON Center: Jetton info fetched for', address);
      
      res.json({
        success: true,
        data: jettonInfo
      });
    } catch (error) {
      console.error('🪙 TON Center: Failed to get jetton info:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get jetton information',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/masterchain - Get masterchain information
   */
  async getMasterchainInfo(req, res) {
    try {
      const masterchainInfo = await tonCenterService.getMasterchainInfo();
      
      console.log('⛓️ TON Center: Masterchain info fetched');
      
      res.json({
        success: true,
        data: masterchainInfo
      });
    } catch (error) {
      console.error('⛓️ TON Center: Failed to get masterchain info:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get masterchain information',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/popular-jettons - Get popular jettons
   */
  async getPopularJettons(req, res) {
    try {
      const jettons = await tonCenterService.getPopularJettons();
      
      console.log('🌟 TON Center: Popular jettons fetched');
      
      res.json({
        success: true,
        data: jettons
      });
    } catch (error) {
      console.error('🌟 TON Center: Failed to get popular jettons:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular jettons',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * GET /api/ton/price - Get TON price
   */
  async getTONPrice(req, res) {
    try {
      const price = await tonCenterService.getTONPrice();
      
      console.log('💲 TON Center: TON price fetched');
      
      res.json({
        success: true,
        data: price
      });
    } catch (error) {
      console.error('💲 TON Center: Failed to get TON price:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get TON price',
        message: error.response?.data?.error || error.message
      });
    }
  }

  /**
   * POST /api/ton/run-method - Run get method on smart contract
   */
  async runGetMethod(req, res) {
    try {
      const { address, method, stack = [] } = req.body;
      
      if (!address || !method) {
        return res.status(400).json({
          success: false,
          error: 'Address and method parameters are required'
        });
      }

      const result = await tonCenterService.runGetMethod(address, method, stack);
      
      console.log('🔧 TON Center: Get method executed', { address, method });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('🔧 TON Center: Failed to run get method:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to run get method',
        message: error.response?.data?.error || error.message
      });
    }
  }
}

export const tonCenterController = new TONCenterController();
