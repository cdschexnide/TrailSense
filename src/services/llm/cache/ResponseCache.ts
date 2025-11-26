import AsyncStorage from '@react-native-async-storage/async-storage';
import { llmLogger } from '@/utils/llmLogger';
import { LLM_CONFIG } from '@/config/llmConfig';

/**
 * Cache Entry Interface
 */
interface CacheEntry {
  prompt: string;
  response: string;
  timestamp: number;
  tokenCount: number;
}

/**
 * Response Cache Service
 * Caches LLM responses to reduce redundant inference and improve performance
 */
export class ResponseCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_KEY_PREFIX = '@llm_cache:';
  private readonly MAX_CACHE_AGE_MS: number;
  private readonly MAX_CACHE_SIZE: number;

  constructor() {
    this.MAX_CACHE_AGE_MS = LLM_CONFIG.CACHE_TTL_MS;
    this.MAX_CACHE_SIZE = LLM_CONFIG.MAX_CACHE_SIZE;

    // Load cache from storage on initialization
    this.loadFromStorage();
  }

  /**
   * Get cached response
   */
  async get(cacheKey: string): Promise<string | null> {
    // Check memory cache first (fastest)
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry && this.isValid(memEntry)) {
      llmLogger.debug('Cache hit (memory)', { key: cacheKey });
      return memEntry.response;
    }

    // Check persistent storage (slower)
    try {
      const storageKey = this.CACHE_KEY_PREFIX + cacheKey;
      const cached = await AsyncStorage.getItem(storageKey);

      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);

        if (this.isValid(entry)) {
          llmLogger.debug('Cache hit (storage)', { key: cacheKey });

          // Promote to memory cache for faster future access
          this.memoryCache.set(cacheKey, entry);

          return entry.response;
        } else {
          // Expired, remove from storage
          llmLogger.debug('Cache entry expired', { key: cacheKey });
          await AsyncStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      llmLogger.error('Cache read error', error);
    }

    llmLogger.debug('Cache miss', { key: cacheKey });
    return null;
  }

  /**
   * Set cached response
   */
  async set(
    cacheKey: string,
    prompt: string,
    response: string,
    tokenCount: number
  ): Promise<void> {
    const entry: CacheEntry = {
      prompt,
      response,
      timestamp: Date.now(),
      tokenCount,
    };

    try {
      // Store in memory cache
      this.memoryCache.set(cacheKey, entry);

      // Enforce max cache size in memory
      if (this.memoryCache.size > this.MAX_CACHE_SIZE) {
        const oldestKey = this.getOldestCacheKey();
        if (oldestKey) {
          this.memoryCache.delete(oldestKey);
          llmLogger.debug('Evicted oldest cache entry', { key: oldestKey });
        }
      }

      // Store in persistent storage
      const storageKey = this.CACHE_KEY_PREFIX + cacheKey;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));

      llmLogger.debug('Cache entry saved', {
        key: cacheKey,
        tokenCount,
      });
    } catch (error) {
      llmLogger.error('Cache write error', error);
    }
  }

  /**
   * Clear all cached responses
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear persistent storage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_KEY_PREFIX));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      llmLogger.info('Cache cleared', { entriesRemoved: cacheKeys.length });
    } catch (error) {
      llmLogger.error('Cache clear error', error);
    }
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<void> {
    try {
      let expiredCount = 0;

      // Clear from memory
      for (const [key, entry] of this.memoryCache.entries()) {
        if (!this.isValid(entry)) {
          this.memoryCache.delete(key);
          expiredCount++;
        }
      }

      // Clear from storage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_KEY_PREFIX));

      for (const storageKey of cacheKeys) {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (!this.isValid(entry)) {
            await AsyncStorage.removeItem(storageKey);
            expiredCount++;
          }
        }
      }

      llmLogger.info('Expired cache entries cleared', { count: expiredCount });
    } catch (error) {
      llmLogger.error('Error clearing expired cache', error);
    }
  }

  /**
   * Generate cache key from prompt and context
   */
  generateCacheKey(prompt: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const combined = prompt + contextStr;

    // Use simple hash function
    const hash = this.simpleHash(combined);

    return `cache_${hash}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      // Hit rate would require tracking hits/misses
    };
  }

  /**
   * Private: Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.MAX_CACHE_AGE_MS;
  }

  /**
   * Private: Load cache from storage into memory
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_KEY_PREFIX));

      if (cacheKeys.length === 0) {
        return;
      }

      // Load entries
      const entries = await AsyncStorage.multiGet(cacheKeys);

      let loadedCount = 0;

      for (const [storageKey, value] of entries) {
        if (!value) continue;

        try {
          const entry: CacheEntry = JSON.parse(value);

          // Only load valid entries
          if (this.isValid(entry)) {
            const cacheKey = storageKey.replace(this.CACHE_KEY_PREFIX, '');
            this.memoryCache.set(cacheKey, entry);
            loadedCount++;

            // Don't exceed max cache size
            if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
              break;
            }
          }
        } catch (error) {
          llmLogger.error('Error parsing cache entry', error);
        }
      }

      llmLogger.info('Cache loaded from storage', {
        entriesLoaded: loadedCount,
      });
    } catch (error) {
      llmLogger.error('Failed to load cache from storage', error);
    }
  }

  /**
   * Private: Get oldest cache key
   */
  private getOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Private: Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }
}

// Export singleton instance
export const responseCache = new ResponseCache();
