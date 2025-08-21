import express from 'express';
import AlchemyController from '../controllers/alchemyController.js';

const router = express.Router();

// Get token balances for an address
router.post('/token-balances', AlchemyController.getTokenBalances.bind(AlchemyController));

// Get token metadata
router.post('/token-metadata', AlchemyController.getTokenMetadata.bind(AlchemyController));

export default router;
