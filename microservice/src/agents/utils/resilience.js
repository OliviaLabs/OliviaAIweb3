/**
 * Resilience Utilities
 * Provides timeout, retry, and circuit breaker functionality for API calls
 */

/**
 * Execute a function with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - Result or timeout error
 */
export async function withTimeout(fn, timeoutMs = 5000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Execute a function with retries and exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {object} options - { maxRetries, initialDelayMs, maxDelayMs }
 * @returns {Promise} - Result or final error
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 2,
    initialDelayMs = 500,
    maxDelayMs = 5000
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delayMs = Math.min(
          initialDelayMs * Math.pow(2, attempt) + Math.random() * 100,
          maxDelayMs
        );
        
        console.log(`⏱️ [Resilience] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delayMs)}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
}

/**
 * Circuit Breaker for API endpoints
 * Prevents repeated calls to failing endpoints
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failures = new Map(); // endpoint -> { count, openUntil }
    this.threshold = options.threshold || 5; // failures before opening
    this.resetTimeMs = options.resetTimeMs || 60000; // 1 minute
  }

  /**
   * Check if circuit is open for an endpoint
   */
  isOpen(endpoint) {
    const state = this.failures.get(endpoint);
    if (!state) return false;

    // Check if circuit should reset
    if (Date.now() > state.openUntil) {
      this.failures.delete(endpoint);
      console.log(`🔄 [CircuitBreaker] Reset: ${endpoint}`);
      return false;
    }

    return state.count >= this.threshold;
  }

  /**
   * Record a failure
   */
  recordFailure(endpoint) {
    const state = this.failures.get(endpoint) || { count: 0, openUntil: 0 };
    state.count++;

    if (state.count >= this.threshold) {
      state.openUntil = Date.now() + this.resetTimeMs;
      console.log(`🧯 [CircuitBreaker] Open: ${endpoint} for ${this.resetTimeMs / 1000}s (${state.count} failures)`);
    }

    this.failures.set(endpoint, state);
  }

  /**
   * Record a success
   */
  recordSuccess(endpoint) {
    if (this.failures.has(endpoint)) {
      this.failures.delete(endpoint);
      console.log(`✅ [CircuitBreaker] Cleared: ${endpoint}`);
    }
  }

  /**
   * Get circuit state
   */
  getState(endpoint) {
    const state = this.failures.get(endpoint);
    if (!state) return { open: false, failures: 0 };
    
    return {
      open: this.isOpen(endpoint),
      failures: state.count,
      openUntil: state.openUntil
    };
  }
}

// Global circuit breaker instance
export const globalCircuitBreaker = new CircuitBreaker({
  threshold: 5,
  resetTimeMs: 60000 // 1 minute
});

/**
 * Wrap API call with full resilience: timeout + retry + circuit breaker
 * @param {Function} fn - Async function to execute
 * @param {string} endpoint - Endpoint identifier for circuit breaker
 * @param {object} options - { timeoutMs, maxRetries, useCircuitBreaker }
 * @returns {Promise} - Result or error
 */
export async function withResilience(fn, endpoint, options = {}) {
  const {
    timeoutMs = 5000,
    maxRetries = 2,
    useCircuitBreaker = true
  } = options;

  // Check circuit breaker
  if (useCircuitBreaker && globalCircuitBreaker.isOpen(endpoint)) {
    const state = globalCircuitBreaker.getState(endpoint);
    const waitSeconds = Math.ceil((state.openUntil - Date.now()) / 1000);
    throw new Error(`Circuit breaker open for ${endpoint} (wait ${waitSeconds}s)`);
  }

  try {
    // Execute with timeout and retry
    const result = await withRetry(
      () => withTimeout(fn, timeoutMs),
      { maxRetries }
    );

    // Record success
    if (useCircuitBreaker) {
      globalCircuitBreaker.recordSuccess(endpoint);
    }

    return result;
  } catch (error) {
    // Record failure
    if (useCircuitBreaker) {
      globalCircuitBreaker.recordFailure(endpoint);
    }

    throw error;
  }
}

