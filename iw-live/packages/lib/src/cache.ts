import { createClient } from "redis";
import {
  createAppError,
  withErrorHandling,
  withConnectionRetry,
  ERROR_CODES,
} from "./error-handling";

// Cache configuration
export interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  ttl?: number; // Default TTL in seconds
  keyPrefix?: string;
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  ttl: 3600, // 1 hour default
  keyPrefix: "integratewise:",
};

class CacheManager {
  private client: ReturnType<typeof createClient> | null = null;
  private config: CacheConfig;
  private connected: boolean = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async connect(): Promise<void> {
    if (this.client?.isReady) {
      this.connected = true;
      return;
    }

    try {
      const client = createClient({
        password: this.config.password,
        database: this.config.db ?? 0,
        socket: {
          host: this.config.host ?? "localhost",
          port: this.config.port ?? 6379,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error("Redis reconnect retries exhausted");
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      client.on("connect", () => {
        console.log("Redis connected");
        this.connected = true;
      });

      client.on("error", (err: unknown) => {
        console.error("Redis error:", err);
        this.connected = false;
      });

      client.on("ready", () => {
        console.log("Redis ready");
        this.connected = true;
      });

      client.on("end", () => {
        console.log("Redis connection ended");
        this.connected = false;
      });

      // Wait for connection
      await client.connect();
      this.client = client;
      this.connected = true;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.client = null;
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    return withErrorHandling(
      async () => {
        return await withConnectionRetry(
          async () => {
            if (!this.client || !this.connected) {
              // Try to reconnect
              await this.connect();
            }

            if (!this.client || !this.connected) {
              return null;
            }

            const value = await this.client.get(this.getKey(key));
            if (!value) {
              return null;
            }

            try {
              return JSON.parse(value);
            } catch (parseError) {
              console.warn(`Cache parse error for key ${key}:`, parseError);
              // Remove corrupted cache entry
              await this.del(key);
              return null;
            }
          },
          {
            maxAttempts: 5,
            baseDelay: 500,
            maxDelay: 5000,
            onRetry: (attempt, error, delay) => {
              console.warn(
                `Cache get retry ${attempt} for key ${key}, error: ${error.message}, delay: ${delay}ms`
              );
            },
          }
        );
      },
      { operation: "cache.get", metadata: { key } },
      null
    );
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    return withErrorHandling(
      async () => {
        return await withConnectionRetry(
          async () => {
            if (!this.client || !this.connected) {
              // Try to reconnect
              await this.connect();
            }

            if (!this.client || !this.connected) {
              return false;
            }

            let serializedValue: string;
            try {
              serializedValue = JSON.stringify(value);
            } catch (serializeError) {
              throw createAppError(
                "VALIDATION_ERROR",
                `Cannot serialize value for cache key ${key}`
              );
            }

            const effectiveTtl = ttl || this.config.ttl;

            if (effectiveTtl && effectiveTtl > 0) {
              await this.client.setEx(this.getKey(key), effectiveTtl, serializedValue);
            } else {
              await this.client.set(this.getKey(key), serializedValue);
            }

            return true;
          },
          {
            maxAttempts: 5,
            baseDelay: 500,
            maxDelay: 5000,
            onRetry: (attempt, error, delay) => {
              console.warn(
                `Cache set retry ${attempt} for key ${key}, error: ${error.message}, delay: ${delay}ms`
              );
            },
          }
        );
      },
      { operation: "cache.set", metadata: { key, ttl } },
      false
    );
  }

  async del(key: string): Promise<boolean> {
    return withErrorHandling(
      async () => {
        return await withConnectionRetry(
          async () => {
            if (!this.client || !this.connected) {
              // Try to reconnect
              await this.connect();
            }

            if (!this.client || !this.connected) {
              return false;
            }

            await this.client.del(this.getKey(key));
            return true;
          },
          {
            maxAttempts: 5,
            baseDelay: 500,
            maxDelay: 5000,
            onRetry: (attempt, error, delay) => {
              console.warn(
                `Cache del retry ${attempt} for key ${key}, error: ${error.message}, delay: ${delay}ms`
              );
            },
          }
        );
      },
      { operation: "cache.del", metadata: { key } },
      false
    );
  }

  async exists(key: string): Promise<boolean> {
    return withErrorHandling(
      async () => {
        if (!this.client || !this.connected) {
          return false;
        }

        const result = await this.client.exists(this.getKey(key));
        return result === 1;
      },
      { operation: "cache.exists", metadata: { key } },
      false
    );
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return withErrorHandling(
      async () => {
        if (!this.client || !this.connected) {
          return false;
        }

        await this.client.expire(this.getKey(key), ttl);
        return true;
      },
      { operation: "cache.expire", metadata: { key, ttl } },
      false
    );
  }

  async ttl(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return -2; // Key doesn't exist
    }

    try {
      return await this.client.ttl(this.getKey(key));
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -2;
    }
  }

  async keys(pattern: string = "*"): Promise<string[]> {
    if (!this.client || !this.connected) {
      return [];
    }

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);
      return keys.map((key) => key.replace(this.config.keyPrefix!, ""));
    } catch (error) {
      console.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async clear(pattern: string = "*"): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const fullKeys = keys.map((key) => this.getKey(key));
      return await this.client.del(fullKeys);
    } catch (error) {
      console.error(`Cache clear error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Hash operations for complex data
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const value = await this.client.hGet(this.getKey(key), field);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset<T = any>(key: string, field: string, value: T): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.hSet(this.getKey(key), field, serializedValue);
      return true;
    } catch (error) {
      console.error(`Cache hset error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, any> | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const result = await this.client.hGetAll(this.getKey(key));
      if (!result || Object.keys(result).length === 0) {
        return null;
      }

      const parsed: Record<string, any> = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }

      return parsed;
    } catch (error) {
      console.error(`Cache hgetall error for key ${key}:`, error);
      return null;
    }
  }

  // List operations for queues/stacks
  async lpush<T = any>(key: string, ...values: T[]): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      const serializedValues = values.map((v) => JSON.stringify(v));
      return await this.client.lPush(this.getKey(key), serializedValues);
    } catch (error) {
      console.error(`Cache lpush error for key ${key}:`, error);
      return 0;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const value = await this.client.rPop(this.getKey(key));
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`Cache rpop error for key ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      return await this.client.lLen(this.getKey(key));
    } catch (error) {
      console.error(`Cache llen error for key ${key}:`, error);
      return 0;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      console.error("Redis ping error:", error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager(config);
  }
  return cacheInstance;
}

// Convenience functions for common operations
export const cache = {
  async get<T = any>(key: string): Promise<T | null> {
    const manager = getCacheManager();
    return manager.get<T>(key);
  },

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    const manager = getCacheManager();
    return manager.set<T>(key, value, ttl);
  },

  async del(key: string): Promise<boolean> {
    const manager = getCacheManager();
    return manager.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const manager = getCacheManager();
    return manager.exists(key);
  },

  async clear(pattern?: string): Promise<number> {
    const manager = getCacheManager();
    return manager.clear(pattern);
  },

  async connect(): Promise<void> {
    const manager = getCacheManager();
    return manager.connect();
  },

  async disconnect(): Promise<void> {
    const manager = getCacheManager();
    return manager.disconnect();
  },

  isConnected(): boolean {
    const manager = getCacheManager();
    return manager.isConnected();
  },
};

export default cache;
