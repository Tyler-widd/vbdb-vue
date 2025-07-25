// services/apiService.js
import cacheService from "./cacheServices";

const API_BASE = "https://api.volleyballdatabased.com";

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
    this.abortControllers = new Map();
  }

  async fetchWithCache(endpoint, cacheKey, cacheMinutes = 5, options = {}) {
    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Cancel any existing request for this endpoint
    this.cancelRequest(endpoint);

    // Create new abort controller
    const controller = new AbortController();
    this.abortControllers.set(endpoint, controller);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the successful response
      cacheService.set(cacheKey, data, cacheMinutes);

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`Request cancelled: ${endpoint}`);
      } else {
        console.error(`Error fetching ${endpoint}:`, error);
      }
      throw error;
    } finally {
      this.abortControllers.delete(endpoint);
    }
  }

  cancelRequest(endpoint) {
    const controller = this.abortControllers.get(endpoint);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(endpoint);
    }
  }

  // Specific API methods
  async getSchools() {
    return this.fetchWithCache("/schools", "schools-all", 30);
  }

  async getTeam(teamId) {
    return this.fetchWithCache(`/teams/${teamId}`, `team-${teamId}`, 10);
  }

  async getTeamGames(teamId) {
    return this.fetchWithCache(`/games/${teamId}`, `games-${teamId}`, 5);
  }

  async getMegaGames(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/megagames${queryString ? "?" + queryString : ""}`;
    const cacheKey = `megagames-${queryString}`;
    return this.fetchWithCache(endpoint, cacheKey, 5);
  }

  async getSchedule() {
    return this.fetchWithCache("/schedule", "schedule-all", 10);
  }

  async getSeasons() {
    return this.fetchWithCache("/seasons", "seasons-all", 60);
  }
}

export default new ApiService();
