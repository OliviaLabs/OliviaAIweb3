import express from 'express';
import coinGeckoController from '../controllers/coinGeckoController.js';

const router = express.Router();

// Get token price
router.get('/price', coinGeckoController.getPrice);

// Search for coins
router.get('/search', coinGeckoController.searchCoins);

export default router;
