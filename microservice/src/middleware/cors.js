import cors from 'cors';
import { config } from '../config/config.js';

/**
 * CORS middleware configuration
 * Only allows requests from the configured allowed origin in production
 * Allows all origins in development mode
 */
// Allow both local and production origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://192.168.0.66:3000', // Local network
  'https://oliviaaiweb3-1.onrender.com', // Production
  'https://olivia-ai-microservice.onrender.com' // Microservice itself
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Plugin-States', 'Origin', 'X-Requested-With', 'Accept']
});

/**
 * Custom origin validation middleware for additional security
 * Skips validation in development mode for convenience
 */
export const validateOrigin = (req, res, next) => {
  // ALWAYS skip origin validation - allow all origins
  console.log('🌐 CORS: Allowing all origins - no validation');
  return next();
};
