import express from 'express';
import openaiRoutes from './openaiRoutes.js';
import changeNowRoutes from './changeNowRoutes.js';
import coinStatsRoutes from './coinStatsRoutes.js';
import lurkyRoutes from './lurkyRoutes.js';
import okxRoutes from './okxRoutes.js';
import zeroXRoutes from './zeroXRoutes.js';
import alchemyRoutes from './alchemyRoutes.js';
import coinGeckoRoutes from './coinGeckoRoutes.js';
import layerzeroRoutes from './layerzeroRoutes.js';
import { OpenAIController } from '../controllers/openaiController.js';

const router = express.Router();

// Health check endpoint (no authentication required)
router.get('/health', OpenAIController.healthCheck);

// OpenAI routes
router.use('/openai', openaiRoutes);

// ChangeNOW routes
router.use('/changenow', changeNowRoutes);

// CoinStats routes
router.use('/coinstats', coinStatsRoutes);

// Lurky routes
router.use('/lurky', lurkyRoutes);

// OKX DEX routes
router.use('/okx', okxRoutes);

// 0x Protocol routes
router.use('/zerox', zeroXRoutes);

// Alchemy routes
router.use('/alchemy', alchemyRoutes);

// CoinGecko routes
router.use('/coingecko', coinGeckoRoutes);

// LayerZero routes - simple test route
router.get('/layerzero/supported-assets', (req, res) => {
  res.json({
    success: true,
    data: {
      chains: [
        { id: 'ethereum', name: 'Ethereum' },
        { id: 'arbitrum', name: 'Arbitrum' },
        { id: 'polygon', name: 'Polygon' },
        { id: 'optimism', name: 'Optimism' },
        { id: 'base', name: 'Base' }
      ],
      tokens: [
        { symbol: 'USDC', name: 'USD Coin' },
        { symbol: 'USDT', name: 'Tether USD' },
        { symbol: 'ETH', name: 'Ethereum' }
      ]
    }
  });
});

// LayerZero fee estimation
router.post('/layerzero/estimate-fee', (req, res) => {
  const { token, amount, fromChain, toChain } = req.body;
  
  // Simple fee calculation
  const baseFee = 5.0;
  const amountFactor = parseFloat(amount || 0) * 0.001;
  const estimatedFee = (baseFee + amountFactor).toFixed(2);
  
  res.json({
    success: true,
    data: {
      feeETH: '0.005000',
      feeUSD: estimatedFee,
      gasEstimate: '150000'
    }
  });
});

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
        portfolioInsights: '/api/coinstats/portfolio-insights'
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
      },
      layerzero: {
        supportedAssets: '/api/layerzero/supported-assets',
        estimateFee: '/api/layerzero/estimate-fee'
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
