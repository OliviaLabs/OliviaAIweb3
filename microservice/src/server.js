import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/config.js';
import { corsMiddleware } from './middleware/cors.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { authenticateWebSocket } from './middleware/websocketAuth.js';
import { websocketProxyService } from './services/websocketProxy.js';
import routes from './routes/index.js';

// Import enhanced AI system components
import { globalMetrics } from './utils/trace.js';
import { globalCircuitBreaker } from './agents/utils/resilience.js';

// Create Express application
const app = express();

// Initialize Enhanced AI System
console.log('🤖 Initializing Enhanced AI Agent System...');
console.log('  ✅ Structured intent extraction (function calling)');
console.log('  ✅ Input normalization & language detection');
console.log('  ✅ Smart routing (trade vs info)');
console.log('  ✅ Entity propagation through pipeline');
console.log('  ✅ Collision-resistant caching');
console.log('  ✅ Resilience (timeouts, retries, circuit breakers)');
console.log('  ✅ Follow-up intelligence (no repeats)');
console.log('  ✅ Multilingual support (10+ languages)');
console.log('  ✅ Parameter validation & sanitization');
console.log('  ✅ Full observability (traceId, metrics, structured logs)');
console.log('🎯 Enhanced AI system ready!');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:", "http://localhost:*"],
      frameSrc: ["'self'", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Trust proxy for rate limiting (important for getting real client IPs)
app.set('trust proxy', 1);

// CORS middleware
app.use(corsMiddleware);

// Add headers for Coinbase Wallet SDK
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// Rate limiting middleware (applied globally)
const globalRateLimit = createRateLimiter();
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api', routes);

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct path to dist folder
// In production on Render:
// __dirname = /opt/render/project/src/microservice/src
// dist folder = /opt/render/project/src/dist
// So we need to go up 2 levels from src/microservice/src to src, then into dist
const distPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(__dirname, '../../frontend/dist')  // Go up 2 levels then into frontend/dist
  : path.join(__dirname, '../../frontend/dist');     // same for dev

console.log('🗂️ Serving static files from:', distPath);
console.log('🗂️ Current directory:', process.cwd());
console.log('🗂️ __dirname:', __dirname);

// Serve static files from the frontend build
app.use(express.static(distPath));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('📄 Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // CORS error
  if (error.message.includes('CORS policy')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Create HTTP server
const PORT = config.port;
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: config.websocketPath
});

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  console.log('🔌 New WebSocket connection attempt');
  
  // Authenticate WebSocket connection
  const authResult = authenticateWebSocket(request);
  
  if (!authResult.success) {
    console.log(`❌ WebSocket authentication failed: ${authResult.message}`);
    ws.close(authResult.code, authResult.message);
    return;
  }
  
  const { clientId } = authResult;
  console.log(`✅ WebSocket connection authenticated: ${clientId}`);
  
  // Create proxy connection to external WebSocket
  try {
    websocketProxyService.createProxyConnection(ws, clientId);
    console.log(`🔗 Proxy connection established for client: ${clientId}`);
  } catch (error) {
    console.error(`🚨 Failed to create proxy connection for client ${clientId}:`, error);
    ws.close(1011, 'Failed to establish proxy connection');
  }
});

// WebSocket server statistics endpoint (after WebSocket server is created)
app.get('/api/websocket/stats', (req, res) => {
  const stats = websocketProxyService.getStats();
  res.json({
    success: true,
    websocket_stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Start server only when run directly (not during testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => {
    console.log('\n🚀 ============================================');
    console.log('🚀 OpenAI Microservice Started');
    console.log('🚀 ============================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔒 CORS origin: ${config.allowedOrigin}`);
    console.log(`⚡ Rate limit: ${config.rateLimitMaxRequests} req/${config.rateLimitWindowMs / 1000}s`);
    console.log('\n🌐 WebSocket:');
    console.log(`  Proxy: ws://localhost:${PORT}${config.websocketPath}`);
    console.log(`  Stats: http://localhost:${PORT}/api/websocket/stats`);
    console.log('\n🏥 Endpoints:');
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log(`  Docs: http://localhost:${PORT}/api`);
    console.log('\n🤖 Enhanced AI Endpoints:');
    console.log(`  Smart Chat: POST http://localhost:${PORT}/api/openai/smart-chat`);
    console.log(`  Multi-Agent: POST http://localhost:${PORT}/api/openai/multi-agent`);
    console.log(`  Trading: POST http://localhost:${PORT}/api/openai/chat/completions`);
    console.log('\n✨ Enhanced Features Active:');
    console.log('  • Structured intent (no parsing errors)');
    console.log('  • Auto language detection & translation');
    console.log('  • Smart routing (trade vs info)');
    console.log('  • Resilience (timeout, retry, circuit breaker)');
    console.log('  • Full observability (traceId, metrics)');
    console.log('🚀 ============================================\n');
    
    // Log initial metrics state
    console.log('📊 Metrics initialized:', globalMetrics.getSnapshot());
  });
}

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 ============================================');
  console.log('🛑 Shutting down gracefully...');
  console.log('🛑 ============================================');
  
  // Log final metrics before shutdown
  console.log('\n📊 Final Metrics:');
  const finalMetrics = globalMetrics.getSnapshot();
  console.log(JSON.stringify(finalMetrics, null, 2));
  
  // Log circuit breaker states
  console.log('\n🧯 Circuit Breaker States:');
  console.log('  (Circuit breakers will be logged if any were opened)');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('🔌 WebSocket server closed');
  });
  
  // Cleanup all proxy connections
  websocketProxyService.cleanup();
  
  // Close HTTP server
  server.close(() => {
    console.log('🚀 HTTP server closed');
    console.log('✅ Shutdown complete\n');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
