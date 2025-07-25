// services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  set(key, data, expiryMinutes = 5) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + expiryMinutes * 60 * 1000);
  }

  get(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export default new CacheService();
