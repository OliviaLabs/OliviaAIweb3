import express from 'express';
import openaiRoutes from './openaiRoutes.js';
import changeNowRoutes from './changeNowRoutes.js';
import coinStatsRoutes from './coinStatsRoutes.js';
import lurkyRoutes from './lurkyRoutes.js';
import okxRoutes from './okxRoutes.js';
import zeroXRoutes from './zeroXRoutes.js';
import alchemyRoutes from './alchemyRoutes.js';
import twitterRoutes from './twitterRoutes.js';
import protokolsRoutes from './protokolsRoutes.js';
import tonCenterRoutes from './tonCenterRoutes.js';
import chainbaseRoutes from './chainbaseRoutes.js';
// Commented out until database is set up
// import exploreRoutes from './exploreRoutes.js';
import { OpenAIController } from '../controllers/openaiController.js';
import AlchemyController from '../controllers/alchemyController.js';

const router = express.Router();

// Health check endpoint (no authentication required)
router.get('/health', OpenAIController.healthCheck);

// Portfolio endpoint for frontend compatibility
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'eth-mainnet' } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        success: false,
        error: 'Address is required' 
      });
    }

    console.log(`📊 Portfolio request for ${address} on ${network}`);
    
    // Create a proper request object for the Alchemy controller
    const mockReq = {
      body: { address, network }
    };
    
    // Create a response handler
    let responseData = null;
    let responseStatus = 200;
    
    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };
    
    // Call the Alchemy controller
    await AlchemyController.getTokenBalances(mockReq, mockRes);
    
    // Process the response
    if (responseData) {
      if (responseStatus === 200 && responseData.result) {
        // Transform the Alchemy response to match frontend expectations
        const transformedData = {
          success: true,
          data: responseData.result.tokenBalances?.map(token => ({
            symbol: token.symbol || 'Unknown',
            balance: token.tokenBalance,
            contractAddress: token.contractAddress,
            name: token.name || 'Unknown Token',
            decimals: token.decimals || 18,
            chain: network,
            type: 'ERC-20'
          })) || [],
          totalTokens: responseData.result.tokenBalances?.length || 0,
          address: address,
          network: network
        };
        res.json(transformedData);
      } else {
        res.status(responseStatus).json({
          success: false,
          error: responseData.error || 'Failed to fetch portfolio data',
          message: responseData.message
        });
      }
    } else {
      throw new Error('No response from Alchemy controller');
    }
    
  } catch (error) {
    console.error('Portfolio endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token balances',
      message: error.message
    });
  }
});

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

// TON Center routes
router.use('/ton', tonCenterRoutes);

// Chainbase routes
router.use('/chainbase', chainbaseRoutes);

// 0x Protocol routes
router.use('/zerox', zeroXRoutes);

// Alchemy routes
router.use('/alchemy', alchemyRoutes);

// Twitter routes
router.use('/twitter', twitterRoutes);

// Protokols routes
router.use('/protokols', protokolsRoutes);

// Explore routes (for Explore page only) - Commented out until database is set up
// router.use('/explore', exploreRoutes);

// Default route
router.get('/', (req, res) => {
  res.json({
    service: 'OpenAI Microservice',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      portfolio: '/api/portfolio/:address',
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
      ton: {
        account: '/api/ton/account/:address',
        balance: '/api/ton/balance/:address',
        transactions: '/api/ton/transactions/:address',
        jettons: '/api/ton/jettons/:address',
        jettonInfo: '/api/ton/jetton-info/:address',
        masterchain: '/api/ton/masterchain',
        popularJettons: '/api/ton/popular-jettons',
        price: '/api/ton/price',
        runMethod: '/api/ton/run-method'
      },
      zerox: {
        quote: '/api/zerox/quote',
        price: '/api/zerox/price',
        tokens: '/api/zerox/tokens',
        gasPrice: '/api/zerox/gas-price',
        orderBook: '/api/zerox/orderbook'
      },
      twitter: {
        search: '/api/twitter/search'
      },
      protokols: {
        status: '/api/protokols/status',
        trendingKOLs: '/api/protokols/kol/trending',
        narratives: '/api/protokols/narratives',
        profile: '/api/protokols/profile/:username',
        trendingProjects: '/api/protokols/projects/trending',
        searchPosts: '/api/protokols/posts/search',
        analysis: '/api/protokols/analysis'
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
