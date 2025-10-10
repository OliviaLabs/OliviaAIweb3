import express from 'express';
import { BinanceController } from '../controllers/binanceController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Binance routes are working!' });
});

router.get('/price',
  authenticateAdmin,
  validateOrigin,
  BinanceController.getPrice
);

router.get('/ticker',
  authenticateAdmin,
  validateOrigin,
  BinanceController.get24hrTicker
);

router.get('/orderbook',
  authenticateAdmin,
  validateOrigin,
  BinanceController.getOrderBook
);

router.get('/trades',
  authenticateAdmin,
  validateOrigin,
  BinanceController.getRecentTrades
);

router.get('/klines',
  authenticateAdmin,
  validateOrigin,
  BinanceController.getKlines
);

export default router;
