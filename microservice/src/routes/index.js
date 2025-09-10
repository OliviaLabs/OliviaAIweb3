import express from 'express';
import openaiRoutes from './openaiRoutes.js';
import changeNowRoutes from './changeNowRoutes.js';
import coinStatsRoutes from './coinStatsRoutes.js'; // Re-enabled with plugin control
import lurkyRoutes from './lurkyRoutes.js';
import okxRoutes from './okxRoutes.js';
import zeroXRoutes from './zeroXRoutes.js';
import alchemyRoutes from './alchemyRoutes.js';
import portfolioRoutes from './portfolio.js';
import { OpenAIController } from '../controllers/openaiController.js';
import { pluginAccessMiddleware } from '../lib/pluginManager.js';

const router = express.Router();

// Health check endpoint (no authentication required)
router.get('/health', OpenAIController.healthCheck);

// OpenAI routes (always enabled - core functionality)
router.use('/openai', openaiRoutes);

// Plugin-controlled routes with middleware
router.use('/changenow', pluginAccessMiddleware, changeNowRoutes);
router.use('/coinstats', pluginAccessMiddleware, coinStatsRoutes);
router.use('/lurky', pluginAccessMiddleware, lurkyRoutes);
router.use('/okx', pluginAccessMiddleware, okxRoutes);
router.use('/zerox', pluginAccessMiddleware, zeroXRoutes);
router.use('/alchemy', pluginAccessMiddleware, alchemyRoutes);
router.use('/portfolio', portfolioRoutes);

// Default route
router.get('/', (req, res) => {
  res.json({
    service: 'OpenAI Microservice',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      openai: {
        chatCompletions: '/api/openai/chat/completions',
        extractTrading: '/api/openai/extract-trading',
        models: '/api/openai/models',
        tokenInfo: '/api/openai/token-info'
      },
      changenow: {
        currencies: '/api/changenow/currencies',
        exchangeAmount: '/api/changenow/exchange-amount',
        minAmount: '/api/changenow/min-amount',
        exchangeRate: '/api/changenow/exchange-rate',
        transactions: '/api/changenow/transactions',
        transactionStatus: '/api/changenow/transactions/:id'
      },
      coinstats: {
        coins: '/api/coinstats/coins',
        coin: '/api/coinstats/coins/:coinId',
        markets: '/api/coinstats/markets',
        search: '/api/coinstats/search',
        portfolioInsights: '/api/coinstats/portfolio-insights',
        note: 'Controlled by plugin state - disabled by default'
      },
      lurky: {
        coins: '/api/lurky/coins',
        trending: '/api/lurky/trending',
        genericGet: '/api/lurky/generic/*',
        genericPost: '/api/lurky/generic/*',
        genericDelete: '/api/lurky/generic/*'
      },
      okx: {
        chains: '/api/okx/chains',
        quote: '/api/okx/quote',
        swap: '/api/okx/swap',
        tokens: '/api/okx/tokens',
        popularPairs: '/api/okx/popular-pairs',
        oliviaQuote: '/api/okx/olivia-quote'
      },
      zerox: {
        quote: '/api/zerox/quote',
        price: '/api/zerox/price',
        tokens: '/api/zerox/tokens',
        gasPrice: '/api/zerox/gas-price',
        orderBook: '/api/zerox/orderbook'
      }
    },
    documentation: 'All endpoints require proper JWT authentication and origin validation'
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

export default router;
