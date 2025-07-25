// services/batchService.js
class BatchService {
  constructor() {
    this.pendingRequests = new Map();
    this.batchTimeout = null;
  }

  async batchRequest(type, id) {
    if (!this.pendingRequests.has(type)) {
      this.pendingRequests.set(type, new Set());
    }

    this.pendingRequests.get(type).add(id);

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Set new timeout to execute batch
    return new Promise((resolve) => {
      this.batchTimeout = setTimeout(async () => {
        const ids = Array.from(this.pendingRequests.get(type));
        this.pendingRequests.delete(type);

        // Make batch request
        const results = await this.executeBatch(type, ids);
        resolve(results.find((r) => r.id === id));
      }, 50); // 50ms delay to collect requests
    });
  }

  async executeBatch(type, ids) {
    // Implement batch endpoint call
    const response = await fetch(`${API_BASE}/batch/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    return response.json();
  }
}

export default new BatchService();
