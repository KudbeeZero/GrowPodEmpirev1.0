/**
 * GrowPod Monitor - Custom Error & Performance Tracking SDK
 *
 * A lightweight, Sentry-inspired monitoring solution built specifically
 * for GrowPod Empire blockchain gaming.
 *
 * Features:
 * - Automatic error capture (window.onerror, unhandledrejection)
 * - Performance metrics (page load, API calls, wallet connections)
 * - Blockchain transaction tracking
 * - Session breadcrumbs for debugging context
 * - Batched event submission for efficiency
 */

// Types
interface MonitorConfig {
  endpoint: string;
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of events to capture
  maxBreadcrumbs: number;
  flushInterval: number; // ms between batch sends
  debug: boolean;
}

interface ErrorEvent {
  type: 'error';
  errorHash: string;
  message: string;
  stack?: string;
  errorType: string;
  source: 'frontend' | 'backend' | 'blockchain';
  url: string;
  userAgent: string;
  walletAddress?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface TransactionEvent {
  type: 'transaction';
  txId?: string;
  walletAddress: string;
  action: string;
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface MetricEvent {
  type: 'metric';
  name: string;
  value: number;
  tags?: Record<string, string>;
  walletAddress?: string;
  sessionId: string;
  url: string;
  timestamp: number;
}

interface BreadcrumbEvent {
  type: 'breadcrumb';
  sessionId: string;
  walletAddress?: string;
  action: string;
  category: 'ui' | 'navigation' | 'blockchain' | 'api' | 'console';
  data?: Record<string, unknown>;
  timestamp: number;
}

type MonitorEvent = ErrorEvent | TransactionEvent | MetricEvent | BreadcrumbEvent;

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateErrorHash(message: string, stack?: string): string {
  const str = `${message}${stack?.split('\n')[0] || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `err_${Math.abs(hash).toString(16)}`;
}

function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}

// Main Monitor Class
class GrowPodMonitor {
  private config: MonitorConfig;
  private sessionId: string;
  private walletAddress: string | null = null;
  private eventQueue: MonitorEvent[] = [];
  private breadcrumbs: BreadcrumbEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;
  private pendingTransactions: Map<string, { startTime: number; action: string }> = new Map();

  constructor() {
    this.config = {
      endpoint: '/api/monitor',
      enabled: true,
      sampleRate: 1.0,
      maxBreadcrumbs: 50,
      flushInterval: 5000,
      debug: false,
    };
    this.sessionId = generateSessionId();
  }

  /**
   * Initialize the monitor with optional configuration
   */
  init(options: Partial<MonitorConfig> = {}): void {
    if (this.isInitialized) {
      this.log('Monitor already initialized');
      return;
    }

    this.config = { ...this.config, ...options };

    if (!this.config.enabled) {
      this.log('Monitor disabled');
      return;
    }

    this.setupErrorHandlers();
    this.setupPerformanceObserver();
    this.setupNavigationTracking();
    this.setupConsoleTracking();
    this.startFlushTimer();

    this.isInitialized = true;
    this.log('Monitor initialized', this.config);

    // Track page load
    this.trackMetric('page_load', performance.now(), { page: window.location.pathname });
  }

  /**
   * Set the current user's wallet address
   */
  setUser(walletAddress: string | null): void {
    this.walletAddress = walletAddress;
    this.addBreadcrumb('user_identified', 'ui', { walletAddress });
    this.log('User set:', walletAddress);
  }

  /**
   * Manually capture an error
   */
  captureError(
    error: Error | string,
    context?: { source?: 'frontend' | 'backend' | 'blockchain'; metadata?: Record<string, unknown> }
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorEvent: ErrorEvent = {
      type: 'error',
      errorHash: generateErrorHash(errorObj.message, errorObj.stack),
      message: truncate(errorObj.message, 1000),
      stack: errorObj.stack ? truncate(errorObj.stack, 5000) : undefined,
      errorType: errorObj.name || 'Error',
      source: context?.source || 'frontend',
      url: window.location.href,
      userAgent: navigator.userAgent,
      walletAddress: this.walletAddress || undefined,
      sessionId: this.sessionId,
      metadata: {
        ...context?.metadata,
        breadcrumbs: this.breadcrumbs.slice(-10),
      },
      timestamp: Date.now(),
    };

    this.queueEvent(errorEvent);
    this.addBreadcrumb('error', 'ui', { message: errorObj.message });
  }

  /**
   * Manually capture an exception with additional context
   */
  captureException(error: Error, extras?: Record<string, unknown>): void {
    this.captureError(error, { metadata: extras });
  }

  /**
   * Start tracking a blockchain transaction
   */
  startTransaction(transactionKey: string, action: string): void {
    this.pendingTransactions.set(transactionKey, {
      startTime: Date.now(),
      action,
    });
    this.addBreadcrumb('transaction_start', 'blockchain', { action, transactionKey });
    this.log('Transaction started:', action);
  }

  /**
   * Complete a blockchain transaction tracking
   */
  endTransaction(
    transactionKey: string,
    result: { txId?: string; status: 'success' | 'failed'; errorMessage?: string; metadata?: Record<string, unknown> }
  ): void {
    const pending = this.pendingTransactions.get(transactionKey);
    if (!pending) {
      this.log('No pending transaction found:', transactionKey);
      return;
    }

    const duration = Date.now() - pending.startTime;
    this.pendingTransactions.delete(transactionKey);

    const txEvent: TransactionEvent = {
      type: 'transaction',
      txId: result.txId,
      walletAddress: this.walletAddress || 'unknown',
      action: pending.action,
      status: result.status,
      errorMessage: result.errorMessage,
      duration,
      metadata: result.metadata,
      timestamp: Date.now(),
    };

    this.queueEvent(txEvent);
    this.addBreadcrumb('transaction_end', 'blockchain', {
      action: pending.action,
      status: result.status,
      duration,
    });
    this.log('Transaction ended:', pending.action, result.status, duration + 'ms');
  }

  /**
   * Track a performance metric
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metricEvent: MetricEvent = {
      type: 'metric',
      name,
      value: Math.round(value),
      tags,
      walletAddress: this.walletAddress || undefined,
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: Date.now(),
    };

    this.queueEvent(metricEvent);
    this.log('Metric tracked:', name, value);
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(
    action: string,
    category: 'ui' | 'navigation' | 'blockchain' | 'api' | 'console',
    data?: Record<string, unknown>
  ): void {
    const breadcrumb: BreadcrumbEvent = {
      type: 'breadcrumb',
      sessionId: this.sessionId,
      walletAddress: this.walletAddress || undefined,
      action,
      category,
      data,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Also queue for server storage (sampled)
    if (Math.random() < 0.1) { // Only send 10% of breadcrumbs to server
      this.queueEvent(breadcrumb);
    }
  }

  /**
   * Track an API call
   */
  trackApiCall(url: string, method: string, duration: number, statusCode: number, error?: string): void {
    this.trackMetric('api_call', duration, {
      url: new URL(url, window.location.origin).pathname,
      method,
      status: statusCode.toString(),
    });

    if (error || statusCode >= 400) {
      this.captureError(new Error(`API Error: ${method} ${url} - ${statusCode} ${error || ''}`), {
        source: 'backend',
        metadata: { url, method, statusCode, error },
      });
    }

    this.addBreadcrumb('api_call', 'api', {
      url: new URL(url, window.location.origin).pathname,
      method,
      statusCode,
      duration,
    });
  }

  /**
   * Wrap fetch to automatically track API calls
   */
  wrapFetch(): void {
    const originalFetch = window.fetch;
    const monitor = this;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      const startTime = Date.now();

      try {
        const response = await originalFetch.call(window, input, init);
        const duration = Date.now() - startTime;

        // Don't track monitor API calls to avoid infinite loops
        if (!url.includes('/api/monitor')) {
          monitor.trackApiCall(url, method, duration, response.status);
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        if (!url.includes('/api/monitor')) {
          monitor.trackApiCall(url, method, duration, 0, (error as Error).message);
        }

        throw error;
      }
    };

    this.log('Fetch wrapped for API tracking');
  }

  /**
   * Flush pending events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoint + '/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        // Re-queue events on failure (but limit to prevent memory issues)
        if (this.eventQueue.length < 100) {
          this.eventQueue.unshift(...events.slice(0, 50));
        }
        this.log('Failed to flush events:', response.status);
      } else {
        this.log('Flushed', events.length, 'events');
      }
    } catch (error) {
      // Re-queue events on network failure
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events.slice(0, 50));
      }
      this.log('Network error flushing events:', error);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Shutdown the monitor
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
    this.isInitialized = false;
    this.log('Monitor shutdown');
  }

  // Private methods
  private queueEvent(event: MonitorEvent): void {
    if (!this.config.enabled) return;

    // Sample rate check
    if (Math.random() > this.config.sampleRate) return;

    this.eventQueue.push(event);

    // Flush immediately for errors
    if (event.type === 'error') {
      this.flush();
    }
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError(error || new Error(String(message)), {
        metadata: { source, lineno, colno },
      });
      return false; // Don't suppress the error
    };

    // Unhandled promise rejection
    window.onunhandledrejection = (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      this.captureError(error, {
        metadata: { type: 'unhandledrejection' },
      });
    };

    this.log('Error handlers setup');
  }

  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Track long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.trackMetric('long_task', entry.duration, {
              name: entry.name,
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Track largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackMetric('lcp', lastEntry.startTime, {
          element: (lastEntry as any).element?.tagName || 'unknown',
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackMetric('fid', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      this.log('Performance observers setup');
    } catch (e) {
      this.log('Failed to setup performance observers:', e);
    }
  }

  private setupNavigationTracking(): void {
    // Track route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const monitor = this;

    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      monitor.addBreadcrumb('navigate', 'navigation', {
        url: window.location.pathname,
        type: 'pushState',
      });
      monitor.trackMetric('page_view', 1, { page: window.location.pathname });
      return result;
    };

    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      monitor.addBreadcrumb('navigate', 'navigation', {
        url: window.location.pathname,
        type: 'replaceState',
      });
      return result;
    };

    window.addEventListener('popstate', () => {
      this.addBreadcrumb('navigate', 'navigation', {
        url: window.location.pathname,
        type: 'popstate',
      });
      this.trackMetric('page_view', 1, { page: window.location.pathname });
    });

    this.log('Navigation tracking setup');
  }

  private setupConsoleTracking(): void {
    const originalError = console.error;
    const monitor = this;

    console.error = function(...args) {
      monitor.addBreadcrumb('console.error', 'console', {
        message: args.map(a => String(a)).join(' ').slice(0, 200),
      });
      return originalError.apply(console, args);
    };

    this.log('Console tracking setup');
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[GrowPod Monitor]', ...args);
    }
  }
}

// Singleton instance
export const monitor = new GrowPodMonitor();

// React hook for easy access
export function useMonitor() {
  return monitor;
}

// Convenience exports
export const captureError = monitor.captureError.bind(monitor);
export const captureException = monitor.captureException.bind(monitor);
export const trackMetric = monitor.trackMetric.bind(monitor);
export const addBreadcrumb = monitor.addBreadcrumb.bind(monitor);
export const startTransaction = monitor.startTransaction.bind(monitor);
export const endTransaction = monitor.endTransaction.bind(monitor);

export default monitor;
