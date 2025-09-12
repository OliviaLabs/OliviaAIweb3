/**
 * Protokols Routes
 * API endpoints for KOL insights and social data
 */

import express from 'express';
import ProtokolsController from '../controllers/protokolsController.js';

const router = express.Router();

// Protokols API routes
router.get('/status', ProtokolsController.getStatus);
router.get('/kol/trending', ProtokolsController.getTrendingKOLs);
router.get('/narratives', ProtokolsController.getNarratives);
router.get('/profile/:username', ProtokolsController.getKOLProfile);
router.get('/projects/trending', ProtokolsController.getTrendingProjects);
router.get('/posts/search', ProtokolsController.searchPosts);
router.get('/analysis', ProtokolsController.getCryptoSocialAnalysis);

export default router;
