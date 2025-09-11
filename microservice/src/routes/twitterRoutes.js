import express from 'express';
import { searchTwitter } from '../controllers/twitterController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Twitter search endpoint
router.post('/search', authenticateAdmin, searchTwitter);

export default router;
