// composables/useNewsCache.js
import { ref, reactive } from "vue";

// Global cache that persists across component instances
const newsCache = reactive(new Map());
const CACHE_DURATION = 15 * 60 * 1000;

export function useNewsCache() {
  const getCacheKey = (rssUrl) => {
    return `news_${btoa(rssUrl).replace(/[^a-zA-Z0-9]/g, "_")}`;
  };

  const isCacheValid = (cacheEntry) => {
    if (!cacheEntry) return false;
    const now = Date.now();
    return now - cacheEntry.timestamp < CACHE_DURATION;
  };

  const getCachedNews = (rssUrl) => {
    const key = getCacheKey(rssUrl);
    const cached = newsCache.get(key);

    if (cached && isCacheValid(cached)) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      newsCache.delete(key);
    }

    return null;
  };

  const setCachedNews = (rssUrl, data) => {
    const key = getCacheKey(rssUrl);
    newsCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  };

  const clearCache = (rssUrl = null) => {
    if (rssUrl) {
      const key = getCacheKey(rssUrl);
      newsCache.delete(key);
    } else {
      newsCache.clear();
    }
  };

  const refreshCache = (rssUrl) => {
    clearCache(rssUrl);
  };

  return {
    getCachedNews,
    setCachedNews,
    clearCache,
    refreshCache,
    isCacheValid: (rssUrl) => {
      const key = getCacheKey(rssUrl);
      return isCacheValid(newsCache.get(key));
    },
  };
}
