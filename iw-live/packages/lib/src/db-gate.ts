/**
 * Database Concurrency Gate
 *
 * Controls concurrent database connections to prevent overwhelming
 * serverless runtimes and Neon's connection limits.
 * Implements backpressure with queue management.
 *
 * @integratewise/lib
 */

export interface GateOptions {
  /** Maximum concurrent operations */
  maxConcurrent: number;
  /** Maximum queue size before rejecting */
  maxQueue: number;
  /** Timeout for waiting in queue (ms) */
  queueTimeoutMs: number;
}

export interface GateStats {
  running: number;
  queued: number;
  maxConcurrent: number;
  maxQueue: number;
  totalProcessed: number;
  totalRejected: number;
  totalTimedOut: number;
}

const DEFAULT_OPTIONS: GateOptions = {
  maxConcurrent: 10,
  maxQueue: 50,
  queueTimeoutMs: 30_000,
};

interface QueueItem {
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
  enqueuedAt: number;
}

export class ConcurrencyGate {
  private running = 0;
  private queue: QueueItem[] = [];
  private totalProcessed = 0;
  private totalRejected = 0;
  private totalTimedOut = 0;

  constructor(
    private readonly name: string,
    private readonly options: GateOptions = DEFAULT_OPTIONS
  ) {}

  /**
   * Acquire a slot. Returns a release function.
   * Throws if queue is full or times out.
   */
  async acquire(): Promise<() => void> {
    // If under limit, proceed immediately
    if (this.running < this.options.maxConcurrent) {
      this.running++;
      return this.createReleaser();
    }

    // Check queue capacity
    if (this.queue.length >= this.options.maxQueue) {
      this.totalRejected++;
      throw new GateOverflowError(this.name, this.queue.length);
    }

    // Wait in queue
    return new Promise<() => void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove from queue
        const index = this.queue.findIndex((item) => item.resolve === wrappedResolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        this.totalTimedOut++;
        reject(new GateTimeoutError(this.name, this.options.queueTimeoutMs));
      }, this.options.queueTimeoutMs);

      const wrappedResolve = () => {
        clearTimeout(timeoutId);
        resolve(this.createReleaser());
      };

      this.queue.push({
        resolve: wrappedResolve,
        reject,
        timeoutId,
        enqueuedAt: Date.now(),
      });
    });
  }

  /**
   * Execute a function with gate protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      const result = await fn();
      return result;
    } finally {
      release();
    }
  }

  /**
   * Wrap a function to be protected by this gate
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: Parameters<T>) => this.execute(() => fn(...args))) as T;
  }

  private createReleaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.running--;
      this.totalProcessed++;
      this.processQueue();
    };
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;
    if (this.running >= this.options.maxConcurrent) return;

    const next = this.queue.shift();
    if (next) {
      this.running++;
      next.resolve();
    }
  }

  /** Get current statistics */
  getStats(): GateStats {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.options.maxConcurrent,
      maxQueue: this.options.maxQueue,
      totalProcessed: this.totalProcessed,
      totalRejected: this.totalRejected,
      totalTimedOut: this.totalTimedOut,
    };
  }

  /** Check current load percentage */
  getLoadPercentage(): number {
    return (this.running / this.options.maxConcurrent) * 100;
  }

  /** Check if gate can accept more requests */
  canAccept(): boolean {
    return this.running < this.options.maxConcurrent || this.queue.length < this.options.maxQueue;
  }

  /** Clear the queue (rejects all waiting) */
  clearQueue(): void {
    for (const item of this.queue) {
      clearTimeout(item.timeoutId);
      item.reject(new Error(`Gate '${this.name}' queue cleared`));
    }
    this.queue = [];
  }
}

export class GateOverflowError extends Error {
  constructor(
    public readonly gateName: string,
    public readonly queueSize: number
  ) {
    super(`Gate '${gateName}' queue overflow (${queueSize} waiting)`);
    this.name = "GateOverflowError";
  }
}

export class GateTimeoutError extends Error {
  constructor(
    public readonly gateName: string,
    public readonly timeoutMs: number
  ) {
    super(`Gate '${gateName}' timeout after ${timeoutMs}ms in queue`);
    this.name = "GateTimeoutError";
  }
}

// Pre-configured gates for common use cases
export const gates = {
  /** Main database connection gate */
  database: new ConcurrencyGate("database", {
    maxConcurrent: 10,
    maxQueue: 50,
    queueTimeoutMs: 30_000,
  }),

  /** AI/LLM API calls (rate limited) */
  ai: new ConcurrencyGate("ai", {
    maxConcurrent: 5,
    maxQueue: 20,
    queueTimeoutMs: 60_000,
  }),

  /** External webhook deliveries */
  webhooks: new ConcurrencyGate("webhooks", {
    maxConcurrent: 20,
    maxQueue: 100,
    queueTimeoutMs: 15_000,
  }),

  /** File processing operations */
  fileProcessing: new ConcurrencyGate("file_processing", {
    maxConcurrent: 3,
    maxQueue: 10,
    queueTimeoutMs: 120_000,
  }),
};

/**
 * Factory function to create a new gate
 */
export function createGate(name: string, options?: Partial<GateOptions>): ConcurrencyGate {
  return new ConcurrencyGate(name, { ...DEFAULT_OPTIONS, ...options });
}
