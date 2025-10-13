/**
 * Observability Utilities
 * Provides tracing, structured logging, and metrics
 */

/**
 * Generate a unique trace ID for request tracking
 * @returns {string} - Unique trace ID
 */
export function generateTraceId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Structured logger with trace context
 */
export class TraceLogger {
  constructor(traceId, stage) {
    this.traceId = traceId;
    this.stage = stage;
    this.startTime = Date.now();
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    console.log(JSON.stringify({
      level: 'info',
      traceId: this.traceId,
      stage: this.stage,
      message,
      ...data,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    console.warn(JSON.stringify({
      level: 'warn',
      traceId: this.traceId,
      stage: this.stage,
      message,
      ...data,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Log error message
   */
  error(message, error, data = {}) {
    console.error(JSON.stringify({
      level: 'error',
      traceId: this.traceId,
      stage: this.stage,
      message,
      error: error?.message || error,
      stack: error?.stack,
      ...data,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Log completion with metrics
   */
  complete(data = {}) {
    const duration = Date.now() - this.startTime;
    console.log(JSON.stringify({
      level: 'info',
      traceId: this.traceId,
      stage: this.stage,
      message: 'Stage completed',
      durationMs: duration,
      ...data,
      timestamp: new Date().toISOString()
    }));
    return duration;
  }
}

/**
 * Simple metrics collector
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiFreshFetches: 0,
      apiFailures: 0,
      circuitBreakerOpens: 0,
      totalLatencyMs: 0,
      stageLatency: {}
    };
  }

  /**
   * Increment a counter metric
   */
  increment(metric, value = 1) {
    if (this.metrics[metric] !== undefined) {
      this.metrics[metric] += value;
    }
  }

  /**
   * Record latency
   */
  recordLatency(stage, ms) {
    this.metrics.totalLatencyMs += ms;
    if (!this.metrics.stageLatency[stage]) {
      this.metrics.stageLatency[stage] = { count: 0, totalMs: 0 };
    }
    this.metrics.stageLatency[stage].count++;
    this.metrics.stageLatency[stage].totalMs += ms;
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot() {
    const snapshot = { ...this.metrics };
    
    // Calculate averages
    snapshot.avgLatencyMs = snapshot.requests > 0 
      ? Math.round(snapshot.totalLatencyMs / snapshot.requests)
      : 0;
    
    snapshot.cacheHitRate = (snapshot.cacheHits + snapshot.cacheMisses) > 0
      ? Math.round((snapshot.cacheHits / (snapshot.cacheHits + snapshot.cacheMisses)) * 100)
      : 0;

    // Stage averages
    const stageAvgs = {};
    for (const [stage, data] of Object.entries(snapshot.stageLatency)) {
      stageAvgs[stage] = Math.round(data.totalMs / data.count);
    }
    snapshot.stageAvgLatencyMs = stageAvgs;

    return snapshot;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiFreshFetches: 0,
      apiFailures: 0,
      circuitBreakerOpens: 0,
      totalLatencyMs: 0,
      stageLatency: {}
    };
  }

  /**
   * Log metrics summary
   */
  logSummary(traceId) {
    const snapshot = this.getSnapshot();
    console.log(JSON.stringify({
      level: 'info',
      traceId,
      message: 'Metrics summary',
      metrics: snapshot,
      timestamp: new Date().toISOString()
    }));
  }
}

// Global metrics instance
export const globalMetrics = new MetricsCollector();

/**
 * Trace a request through the entire pipeline
 * @param {Function} fn - Async function to execute with tracing
 * @param {string} requestName - Name of the request
 * @returns {Promise} - Result with trace metadata
 */
export async function traceRequest(fn, requestName) {
  const traceId = generateTraceId();
  const startTime = Date.now();

  globalMetrics.increment('requests');

  try {
    console.log(JSON.stringify({
      level: 'info',
      traceId,
      message: 'Request started',
      request: requestName,
      timestamp: new Date().toISOString()
    }));

    const result = await fn(traceId);

    const duration = Date.now() - startTime;
    globalMetrics.recordLatency('total', duration);

    console.log(JSON.stringify({
      level: 'info',
      traceId,
      message: 'Request completed',
      request: requestName,
      durationMs: duration,
      success: true,
      timestamp: new Date().toISOString()
    }));

    return { ...result, traceId, durationMs: duration };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(JSON.stringify({
      level: 'error',
      traceId,
      message: 'Request failed',
      request: requestName,
      error: error.message,
      stack: error.stack,
      durationMs: duration,
      timestamp: new Date().toISOString()
    }));

    throw error;
  }
}

/**
 * Create a trace context for a specific stage
 * @param {string} traceId - Parent trace ID
 * @param {string} stage - Stage name
 * @returns {TraceLogger} - Logger instance
 */
export function createTraceContext(traceId, stage) {
  return new TraceLogger(traceId, stage);
}

