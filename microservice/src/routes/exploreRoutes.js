import express from 'express';
import { 
  getBubbleData, 
  getTokenSpeakers, 
  submitInfluencer,
  getTrackedInfluencers,
  getUserSubmissions
} from '../controllers/exploreController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required - read-only)
router.get('/bubble-data', getBubbleData);
router.get('/token-speakers/:symbol', getTokenSpeakers);
router.get('/tracked-influencers', getTrackedInfluencers);

// Protected routes (require auth - write operations)
router.post('/submit-influencer', authenticateAdmin, submitInfluencer);
router.get('/user-submissions/:user_id', authenticateAdmin, getUserSubmissions);

export default router;

