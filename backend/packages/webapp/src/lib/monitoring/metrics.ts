/**
 * Centralized Metrics Collection
 * Tracks performance, resource usage, and bottlenecks
 */

import { logger } from "@/lib/server/logger";

interface MetricData {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

interface SystemMetrics {
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    usagePercent: number;
  };
  process: {
    uptime: number;
    pid: number;
    nodeVersion: string;
  };
  requests: {
    total: number;
    active: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
  };
  database: {
    queryCount: number;
    avgQueryTime: number;
    slowQueries: number;
    connectionPool: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  };
}

class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();

  // Request tracking
  private activeRequests = 0;
  private totalRequests = 0;
  private requestDurations: number[] = [];
  private errorCount = 0;

  // Database tracking
  private queryCount = 0;
  private queryDurations: number[] = [];
  private slowQueryThreshold = 1000; // 1s

  // Cache tracking
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheEvictions = 0;

  constructor() {
    // Start metrics collection interval
    if (typeof window === 'undefined') {
      this.startCollection();
    }
  }

  private startCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Log summary every 5 minutes
    setInterval(() => {
      this.logSummary();
    }, 300000);
  }

  private collectSystemMetrics() {
    const mem = process.memoryUsage();
    this.recordGauge('memory.heap.used', mem.heapUsed);
    this.recordGauge('memory.heap.total', mem.heapTotal);
    this.recordGauge('memory.rss', mem.rss);
    this.recordGauge('memory.external', mem.external);
  }

  // === Public API ===

  /**
   * Track request start
   */
  requestStart(): () => void {
    this.activeRequests++;
    this.totalRequests++;
    const startTime = Date.now();

    // Return function to call when request ends
    return () => {
      this.activeRequests--;
      const duration = Date.now() - startTime;
      this.recordHistogram('http.request.duration', duration);
      this.requestDurations.push(duration);

      // Keep only last 1000 requests for percentile calculation
      if (this.requestDurations.length > 1000) {
        this.requestDurations.shift();
      }
    };
  }

  /**
   * Track request error
   */
  requestError(statusCode: number) {
    this.errorCount++;
    this.increment('http.errors.total');
    this.increment(`http.errors.${statusCode}`);
  }

  /**
   * Track database query
   */
  queryStart(): (slow?: boolean) => void {
    this.queryCount++;
    const startTime = Date.now();

    return (slow = false) => {
      const duration = Date.now() - startTime;
      this.queryDurations.push(duration);

      if (slow || duration > this.slowQueryThreshold) {
        this.increment('db.queries.slow');
        logger.warn('Slow database query detected', { durationMs: duration });
      }

      // Keep only last 100 queries
      if (this.queryDurations.length > 100) {
        this.queryDurations.shift();
      }
    };
  }

  /**
   * Track cache operations
   */
  cacheHit() {
    this.cacheHits++;
    this.increment('cache.hits');
  }

  cacheMiss() {
    this.cacheMisses++;
    this.increment('cache.misses');
  }

  cacheEviction() {
    this.cacheEvictions++;
    this.increment('cache.evictions');
  }

  /**
   * Record a counter (incremental value)
   */
  increment(name: string, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Record a gauge (point-in-time value)
   */
  recordGauge(name: string, value: number) {
    this.gauges.set(name, value);
  }

  /**
   * Record a histogram value (for percentile calculations)
   */
  recordHistogram(name: string, value: number) {
    const values = this.histograms.get(name) || [];
    values.push(value);

    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }

    this.histograms.set(name, values);
  }

  /**
   * Calculate percentile from array of values
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const usagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

    const totalCacheOps = this.cacheHits + this.cacheMisses;
    const hitRate = totalCacheOps > 0 ? (this.cacheHits / totalCacheOps) * 100 : 0;

    const avgResponseTime = this.requestDurations.length > 0
      ? Math.round(this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length)
      : 0;

    const p95ResponseTime = Math.round(this.calculatePercentile(this.requestDurations, 95));
    const p99ResponseTime = Math.round(this.calculatePercentile(this.requestDurations, 99));

    const errorRate = this.totalRequests > 0
      ? Math.round((this.errorCount / this.totalRequests) * 100)
      : 0;

    const avgQueryTime = this.queryDurations.length > 0
      ? Math.round(this.queryDurations.reduce((a, b) => a + b, 0) / this.queryDurations.length)
      : 0;

    const slowQueries = this.counters.get('db.queries.slow') || 0;

    return {
      memory: {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        rss: mem.rss,
        external: mem.external,
        heapUsedMB,
        heapTotalMB,
        rssMB,
        usagePercent,
      },
      process: {
        uptime: Math.round(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
      },
      requests: {
        total: this.totalRequests,
        active: this.activeRequests,
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        errorRate,
      },
      database: {
        queryCount: this.queryCount,
        avgQueryTime,
        slowQueries: Number(slowQueries),
        connectionPool: 0, // TODO: Get from Supabase if available
      },
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: Math.round(hitRate),
        evictions: this.cacheEvictions,
      },
    };
  }

  /**
   * Log metrics summary
   */
  private logSummary() {
    const metrics = this.getSystemMetrics();

    logger.info('=== METRICS SUMMARY ===');
    logger.info('Memory Usage', {
      heapMB: `${metrics.memory.heapUsedMB}/${metrics.memory.heapTotalMB}`,
      usage: `${metrics.memory.usagePercent}%`,
      rssMB: metrics.memory.rssMB,
    });
    logger.info('Request Stats', {
      total: metrics.requests.total,
      active: metrics.requests.active,
      avgMs: metrics.requests.avgResponseTime,
      p95Ms: metrics.requests.p95ResponseTime,
      p99Ms: metrics.requests.p99ResponseTime,
      errorRate: `${metrics.requests.errorRate}%`,
    });
    logger.info('Database Stats', {
      queries: metrics.database.queryCount,
      avgMs: metrics.database.avgQueryTime,
      slow: metrics.database.slowQueries,
    });
    logger.info('Cache Stats', {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: `${metrics.cache.hitRate}%`,
    });
    logger.info('Process Info', {
      uptime: `${Math.floor(metrics.process.uptime / 60)}m`,
      pid: metrics.process.pid,
      node: metrics.process.nodeVersion,
    });
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.metrics.clear();
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.activeRequests = 0;
    this.totalRequests = 0;
    this.requestDurations = [];
    this.errorCount = 0;
    this.queryCount = 0;
    this.queryDurations = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheEvictions = 0;
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();
