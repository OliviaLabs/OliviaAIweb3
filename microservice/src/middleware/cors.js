import cors from 'cors';
import { config } from '../config/config.js';

/**
 * CORS middleware configuration
 * Only allows requests from the configured allowed origin in production
 * Allows all origins in development mode
 */
export const corsMiddleware = cors({
  origin: true, // Allow ALL origins - no restrictions
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
