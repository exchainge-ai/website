import { NextResponse } from "next/server";
import { metrics } from "@/lib/monitoring/metrics";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/metrics
 * Returns real-time system metrics and performance data
 */
export async function GET(request: Request) {
  try {
    const systemMetrics = metrics.getSystemMetrics();

    // Check for auth token (optional - for production security)
    const authHeader = request.headers.get("authorization");
    const metricsToken = process.env.METRICS_TOKEN;

    // If METRICS_TOKEN is set, require it for access
    if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
      return NextResponse.json(
        { error: "Unauthorized - invalid metrics token" },
        { status: 401 }
      );
    }

    // Return metrics in different formats based on query param
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";

    if (format === "prometheus") {
      // Prometheus format for Grafana/monitoring tools
      const prometheusMetrics = formatPrometheus(systemMetrics);
      return new Response(prometheusMetrics, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (format === "html") {
      // HTML dashboard for browser viewing
      const html = formatHTML(systemMetrics);
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Default: JSON format
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      metrics: systemMetrics,
    });
  } catch (error) {
    logger.error("Failed to get metrics", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to retrieve metrics" },
      { status: 500 }
    );
  }
}

function formatPrometheus(m: ReturnType<typeof metrics.getSystemMetrics>): string {
  return `# HELP process_heap_bytes Process heap memory in bytes
# TYPE process_heap_bytes gauge
process_heap_bytes{type="used"} ${m.memory.heapUsed}
process_heap_bytes{type="total"} ${m.memory.heapTotal}

# HELP process_resident_memory_bytes Resident memory size in bytes
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes ${m.memory.rss}

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${m.requests.total}

# HELP http_requests_active Currently active HTTP requests
# TYPE http_requests_active gauge
http_requests_active ${m.requests.active}

# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms{quantile="0.5"} ${m.requests.avgResponseTime}
http_request_duration_ms{quantile="0.95"} ${m.requests.p95ResponseTime}
http_request_duration_ms{quantile="0.99"} ${m.requests.p99ResponseTime}

# HELP http_error_rate_percent HTTP error rate percentage
# TYPE http_error_rate_percent gauge
http_error_rate_percent ${m.requests.errorRate}

# HELP db_queries_total Total database queries
# TYPE db_queries_total counter
db_queries_total ${m.database.queryCount}

# HELP db_query_duration_ms Average database query duration
# TYPE db_query_duration_ms gauge
db_query_duration_ms ${m.database.avgQueryTime}

# HELP db_slow_queries_total Slow database queries (>1s)
# TYPE db_slow_queries_total counter
db_slow_queries_total ${m.database.slowQueries}

# HELP cache_hits_total Cache hits
# TYPE cache_hits_total counter
cache_hits_total ${m.cache.hits}

# HELP cache_misses_total Cache misses
# TYPE cache_misses_total counter
cache_misses_total ${m.cache.misses}

# HELP cache_hit_rate_percent Cache hit rate percentage
# TYPE cache_hit_rate_percent gauge
cache_hit_rate_percent ${m.cache.hitRate}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${m.process.uptime}
`;
}

function formatHTML(m: ReturnType<typeof metrics.getSystemMetrics>): string {
  const uptimeMinutes = Math.floor(m.process.uptime / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const memoryWarning = m.memory.usagePercent > 80 ? "WARNING" : "";
  const errorWarning = m.requests.errorRate > 5 ? "WARNING" : "";
  const cacheWarning = m.cache.hitRate < 50 ? "WARNING" : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ExchAInge Metrics Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .timestamp {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
    }
    .card-title {
      font-size: 14px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .metric:last-child { margin-bottom: 0; }
    .metric-label {
      font-size: 14px;
      color: #cbd5e1;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .metric-value.good { color: #10b981; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.error { color: #ef4444; }
    .progress {
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      transition: width 0.3s;
    }
    .progress-bar.warning { background: #f59e0b; }
    .progress-bar.error { background: #ef4444; }
    .refresh {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .refresh:hover { background: #2563eb; }
  </style>
  <script>
    function autoRefresh() {
      setTimeout(() => window.location.reload(), 10000);
    }
    window.onload = autoRefresh;
  </script>
</head>
<body>
  <div class="container">
    <h1>ExchAInge Metrics Dashboard</h1>
    <div class="timestamp">Last updated: ${new Date().toISOString()}</div>

    <div class="grid">
      <div class="card">
        <div class="card-title">💾 Memory Usage ${memoryWarning}</div>
        <div class="metric">
          <span class="metric-label">Heap Used</span>
          <span class="metric-value ${m.memory.usagePercent > 80 ? 'warning' : 'good'}">
            ${m.memory.heapUsedMB} MB
          </span>
        </div>
        <div class="metric">
          <span class="metric-label">Heap Total</span>
          <span class="metric-value">${m.memory.heapTotalMB} MB</span>
        </div>
        <div class="metric">
          <span class="metric-label">RSS</span>
          <span class="metric-value">${m.memory.rssMB} MB</span>
        </div>
        <div class="progress">
          <div class="progress-bar ${m.memory.usagePercent > 80 ? 'warning' : ''}"
               style="width: ${m.memory.usagePercent}%"></div>
        </div>
        <div class="metric" style="margin-top: 8px;">
          <span class="metric-label">Usage</span>
          <span class="metric-value">${m.memory.usagePercent}%</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">HTTP Requests ${errorWarning}</div>
        <div class="metric">
          <span class="metric-label">Total Requests</span>
          <span class="metric-value">${m.requests.total}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Active Now</span>
          <span class="metric-value good">${m.requests.active}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Avg Response</span>
          <span class="metric-value">${m.requests.avgResponseTime}ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">P95 Response</span>
          <span class="metric-value ${m.requests.p95ResponseTime > 1000 ? 'warning' : ''}">
            ${m.requests.p95ResponseTime}ms
          </span>
        </div>
        <div class="metric">
          <span class="metric-label">Error Rate</span>
          <span class="metric-value ${m.requests.errorRate > 5 ? 'error' : 'good'}">
            ${m.requests.errorRate}%
          </span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🗄️ Database</div>
        <div class="metric">
          <span class="metric-label">Total Queries</span>
          <span class="metric-value">${m.database.queryCount}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Avg Query Time</span>
          <span class="metric-value ${m.database.avgQueryTime > 500 ? 'warning' : 'good'}">
            ${m.database.avgQueryTime}ms
          </span>
        </div>
        <div class="metric">
          <span class="metric-label">Slow Queries (>1s)</span>
          <span class="metric-value ${m.database.slowQueries > 0 ? 'warning' : 'good'}">
            ${m.database.slowQueries}
          </span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚡ Cache Performance ${cacheWarning}</div>
        <div class="metric">
          <span class="metric-label">Cache Hits</span>
          <span class="metric-value good">${m.cache.hits}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Cache Misses</span>
          <span class="metric-value warning">${m.cache.misses}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Hit Rate</span>
          <span class="metric-value ${m.cache.hitRate < 50 ? 'warning' : 'good'}">
            ${m.cache.hitRate}%
          </span>
        </div>
        <div class="progress">
          <div class="progress-bar" style="width: ${m.cache.hitRate}%"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙️ Process Info</div>
        <div class="metric">
          <span class="metric-label">Uptime</span>
          <span class="metric-value">${uptimeHours}h ${uptimeMinutes % 60}m</span>
        </div>
        <div class="metric">
          <span class="metric-label">PID</span>
          <span class="metric-value">${m.process.pid}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Node Version</span>
          <span class="metric-value">${m.process.nodeVersion}</span>
        </div>
      </div>
    </div>

    <button class="refresh" onclick="window.location.reload()">🔄 Refresh Now</button>
  </div>
</body>
</html>`;
}
