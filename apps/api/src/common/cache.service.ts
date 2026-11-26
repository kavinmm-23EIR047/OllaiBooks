import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly memoryCache = new Map<string, CacheEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRedisConnected = false;

  constructor(private readonly config: ConfigService) { }

  async onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<number>('REDIS_PORT', 6379);
    const password = this.config.get<string>('REDIS_PASSWORD') || undefined;
    const isRedisDisabled = this.config.get<string>('DISABLE_REDIS') === 'true';

    if (!isRedisDisabled) {
      try {
        this.redis = new Redis({
          host,
          port,
          password,
          lazyConnect: true,
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) {
              return null; // Stop retrying; fall back to high-performance in-memory cache
            }
            return Math.min(times * 100, 1000);
          },
        });

        this.redis.on('connect', () => {
          this.isRedisConnected = true;
          this.logger.log(`⚡ Connected to Redis at ${host}:${port} for multi-tenant query caching`);
        });

        this.redis.on('error', (err) => {
          if (this.isRedisConnected) {
            this.logger.warn(`Redis disconnected (${err.message}). Using in-memory fallback cache.`);
          }
          this.isRedisConnected = false;
        });

        await this.redis.connect().catch(() => {
          this.logger.warn(`Redis not available at ${host}:${port}. Using high-speed in-memory LRU cache fallback.`);
          this.isRedisConnected = false;
        });
      } catch {
        this.isRedisConnected = false;
      }
    }

    // Background garbage collection for in-memory cache (every 60 seconds)
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000);
  }

  async onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
    }
  }

  /**
   * Generates a multi-tenant isolated cache key
   */
  tenantKey(tenantId: string, namespace: string, key: string): string {
    return `tenant:${tenantId}:${namespace}:${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // Fall back to memory cache on Redis error
      }
    }

    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    const stringified = JSON.stringify(value);

    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, stringified, 'EX', ttlSeconds);
      } catch {
        // Fall back to memory
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        // Ignore
      }
    }
    this.memoryCache.delete(key);
  }

  /**
   * Invalidates all cache keys for a given tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    const prefix = `tenant:${tenantId}:`;

    // Invalidate in memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate in Redis if connected
    if (this.isRedisConnected && this.redis) {
      try {
        const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 });
        stream.on('data', (keys: string[]) => {
          if (keys.length && this.redis) {
            const pipeline = this.redis.pipeline();
            keys.forEach((k) => pipeline.del(k));
            pipeline.exec();
          }
        });
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Helper that checks cache first, or computes and caches the result
   */
  async wrap<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

