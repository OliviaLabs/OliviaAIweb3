import express from 'express';
import { CoinGeckoController } from '../controllers/coingeckoController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';

const router = express.Router();

/**
 * CoinGecko API Routes
 */

// Get trending coins
router.get('/trending',
  authenticateAdmin,
  validateOrigin,
  CoinGeckoController.getTrending
);

// Get simple prices
router.get('/prices',
  authenticateAdmin,
  validateOrigin,
  CoinGeckoController.getPrices
);

// Get coin details
router.get('/coins/:coinId',
  authenticateAdmin,
  validateOrigin,
  CoinGeckoController.getCoinDetails
);

// Get market data
router.get('/markets',
  authenticateAdmin,
  validateOrigin,
  CoinGeckoController.getMarkets
);

// Search coins
router.get('/search',
  authenticateAdmin,
  validateOrigin,
  CoinGeckoController.search
);

export default router;
