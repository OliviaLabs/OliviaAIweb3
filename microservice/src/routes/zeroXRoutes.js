import express from 'express';
import { getSwapPrice, getSwapQuote, getTokens, getGasPrice, getOrderBook, simulateSwap } from '../controllers/zeroXController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting for 0x routes
const zeroXRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs (0x has rate limits)
  message: {
    error: 'Too many 0x Protocol requests',
    code: 'ZEROX_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * GET /api/zerox/quote
 * Get swap quote from 0x Protocol
 * Required params: sellToken, buyToken, sellAmount OR buyAmount
 * Optional params: takerAddress, slippagePercentage
 */
router.get('/quote', 
  zeroXRateLimit,
  authenticateAdmin,
  validateOrigin,
  getSwapQuote
);

/**
 * GET /api/zerox/price
 * Get swap price (lighter version of quote)
 * Required params: sellToken, buyToken, sellAmount OR buyAmount
 */
router.get('/price', 
  zeroXRateLimit,
  authenticateAdmin,
  validateOrigin,
  getSwapPrice
);

/**
 * GET /api/zerox/tokens
 * Get list of supported tokens
 */
router.get('/tokens', 
  zeroXRateLimit,
  authenticateAdmin,
  validateOrigin,
  getTokens
);

/**
 * GET /api/zerox/gas-price
 * Get current gas price estimates
 */
router.get('/gas-price', 
  zeroXRateLimit,
  authenticateAdmin,
  validateOrigin,
  getGasPrice
);

/**
 * GET /api/zerox/orderbook
 * Get order book for a token pair
 * Required params: baseToken, quoteToken
 * Optional params: perPage
 */
router.get('/orderbook', 
  zeroXRateLimit,
  authenticateAdmin,
  validateOrigin,
  getOrderBook
);

/**
 * POST /api/zerox/simulate
 * Simulate a swap transaction before execution (preflight check)
 * Required body params: to, data, from
 * Optional params: value, chainId
 */
router.post('/simulate',
  zeroXRateLimit,
  authenticateAdmin,
  validateOrigin,
  simulateSwap
);

export default router;
