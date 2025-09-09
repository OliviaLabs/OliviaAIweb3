// 0x Protocol Routes
import express from 'express';
import { getSwapPrice, getSwapQuote } from '../controllers/zeroXController.js';

const router = express.Router();

// Get swap price - following 0x documentation
router.get('/price', getSwapPrice);

// Get swap quote - following 0x documentation  
router.get('/quote', getSwapQuote);

export default router;
