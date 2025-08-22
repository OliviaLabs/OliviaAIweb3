import express from 'express';
import LayerZeroController from '../controllers/layerzeroController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Estimate bridge fee
router.post('/estimate-fee', authenticateAdmin, LayerZeroController.estimateFee);

// Prepare bridge transaction
router.post('/prepare-bridge', authenticateAdmin, LayerZeroController.prepareBridge);

// Execute bridge transaction
router.post('/execute-bridge', authenticateAdmin, LayerZeroController.executeBridge);

// Get supported chains and tokens
router.get('/supported-assets', LayerZeroController.getSupportedAssets);

export default router;
