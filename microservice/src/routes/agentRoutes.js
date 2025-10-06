import express from 'express';
import AgentController from '../controllers/agentController.js';

const router = express.Router();

// Main agent chat endpoint
router.post('/chat', AgentController.chat);

// Health check
router.get('/health', AgentController.health);

// Test endpoints (for development)
router.post('/test-intent', AgentController.testIntent);

export default router;
