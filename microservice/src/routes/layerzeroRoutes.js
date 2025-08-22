import express from 'express';
import LayerZeroController from '../controllers/layerzeroController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Estimate bridge fee
router.post('/estimate-fee', authenticateToken, LayerZeroController.estimateFee);

// Prepare bridge transaction
router.post('/prepare-bridge', authenticateToken, LayerZeroController.prepareBridge);

// Execute bridge transaction
router.post('/execute-bridge', authenticateToken, LayerZeroController.executeBridge);

// Get supported chains and tokens
router.get('/supported-assets', LayerZeroController.getSupportedAssets);

export default router;
