import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { tonCenterController } from '../controllers/tonCenterController.js';

const router = express.Router();

/**
 * TON Center API Routes
 * All routes require authentication and origin validation
 */

// Middleware for all TON Center routes
router.use(authenticateAdmin);
router.use(validateOrigin);

/**
 * GET /api/ton/account/:address
 * Get account information by address
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "balance": "1000000000",
 *     "state": "active",
 *     "last_activity": 1234567890
 *   }
 * }
 */
router.get('/account/:address', async (req, res) => {
  try {
    await tonCenterController.getAccountInfo(req, res);
  } catch (error) {
    console.error('🔗 TON Center Route Error (account):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/balance/:address
 * Get account balance
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "balance": "1000000000"
 *   }
 * }
 */
router.get('/balance/:address', async (req, res) => {
  try {
    await tonCenterController.getAccountBalance(req, res);
  } catch (error) {
    console.error('💰 TON Center Route Error (balance):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/transactions/:address
 * Get account transactions
 * 
 * Query Parameters:
 * - limit: Number of transactions to return (default: 10)
 * - lt: Logical time for pagination
 * - hash: Transaction hash for pagination
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "transactions": [...]
 *   }
 * }
 */
router.get('/transactions/:address', async (req, res) => {
  try {
    await tonCenterController.getAccountTransactions(req, res);
  } catch (error) {
    console.error('📝 TON Center Route Error (transactions):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/jettons/:address
 * Get jetton (token) balances for an account
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "balances": [...]
 *   }
 * }
 */
router.get('/jettons/:address', async (req, res) => {
  try {
    await tonCenterController.getJettonBalances(req, res);
  } catch (error) {
    console.error('🪙 TON Center Route Error (jettons):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/jetton-info/:address
 * Get jetton information by address
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "name": "Jetton Name",
 *     "symbol": "JET",
 *     "decimals": 9
 *   }
 * }
 */
router.get('/jetton-info/:address', async (req, res) => {
  try {
    await tonCenterController.getJettonInfo(req, res);
  } catch (error) {
    console.error('🪙 TON Center Route Error (jetton-info):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/masterchain
 * Get masterchain information
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "last": {
 *       "seqno": 123456,
 *       "shard": "8000000000000000",
 *       "root_hash": "...",
 *       "file_hash": "..."
 *     }
 *   }
 * }
 */
router.get('/masterchain', async (req, res) => {
  try {
    await tonCenterController.getMasterchainInfo(req, res);
  } catch (error) {
    console.error('⛓️ TON Center Route Error (masterchain):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/popular-jettons
 * Get popular jettons (tokens)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "jettons": [...]
 *   }
 * }
 */
router.get('/popular-jettons', async (req, res) => {
  try {
    await tonCenterController.getPopularJettons(req, res);
  } catch (error) {
    console.error('🌟 TON Center Route Error (popular-jettons):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ton/price
 * Get TON price in USD
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "price": "2.50",
 *     "currency": "USD"
 *   }
 * }
 */
router.get('/price', async (req, res) => {
  try {
    await tonCenterController.getTONPrice(req, res);
  } catch (error) {
    console.error('💲 TON Center Route Error (price):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/ton/run-method
 * Run get method on smart contract
 * 
 * Body:
 * {
 *   "address": "EQD...",
 *   "method": "get_wallet_data",
 *   "stack": []
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "stack": [...],
 *     "exit_code": 0
 *   }
 * }
 */
router.post('/run-method', async (req, res) => {
  try {
    await tonCenterController.runGetMethod(req, res);
  } catch (error) {
    console.error('🔧 TON Center Route Error (run-method):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
