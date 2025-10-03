import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

/**
 * Rate limiting middleware
 * Limits requests based on IP address
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: config.rateLimitWindowMs, // Time window in milliseconds
    max: config.rateLimitMaxRequests, // Maximum number of requests per window
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000) // in seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Use default keyGenerator (handles IPv6 properly)
    skip: (req) => {
      // Skip rate limiting for health check endpoints
      return req.path === '/health';
    }
  });
};

/**
 * Stricter rate limiter for OpenAI endpoints
 */
export const createOpenAIRateLimiter = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isDevelopment ? 100 : 10, // 100 requests/min in dev, 10 in production
    message: {
      error: 'Too many OpenAI requests from this IP, please try again later.',
      code: 'OPENAI_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 // in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // In development, you can optionally skip rate limiting entirely
      // return isDevelopment;
      return false; // Still apply limits, just more generous
    }
    // Use default keyGenerator (handles IPv6 properly)
  });
};
