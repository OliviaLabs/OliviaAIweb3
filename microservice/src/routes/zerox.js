// 0x Protocol Routes
import express from 'express';
import { getSwapPrice, getSwapQuote, getWalletBalance } from '../controllers/zeroXController.js';

const router = express.Router();

// Get swap price - following 0x documentation
router.get('/price', getSwapPrice);

// Get swap quote - following 0x documentation  
router.get('/quote', getSwapQuote);

// Get wallet balance - new portfolio functionality
router.get('/balance', getWalletBalance);

export default router;
