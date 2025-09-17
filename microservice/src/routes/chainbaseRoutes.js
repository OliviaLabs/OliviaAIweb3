import express from 'express';
import chainbaseController from '../controllers/chainbaseController.js';
import { authenticateAdmin as auth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Blockchain data routes
router.get('/latest-block', chainbaseController.getLatestBlock);
router.get('/transactions', chainbaseController.getTransactions);
router.get('/token-price', chainbaseController.getTokenPrice);
router.get('/nfts', chainbaseController.getNFTData);
router.get('/defi', chainbaseController.getDeFiData);
router.get('/cross-chain', chainbaseController.getCrossChainData);

// Chain information routes
router.get('/chains', chainbaseController.getSupportedChains);
router.get('/stats/:chainId', chainbaseController.getNetworkStats);

// Account routes
router.get('/account/balance/:chainId/:address', chainbaseController.getAccountBalance);

export default router;
