// utils/retryFetch.js
export async function retryFetch(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryFetch(fn, retries - 1, delay * 2);
  }
}

// Usage
const fetchWithRetry = async () => {
  return retryFetch(() => apiService.getSchools(), 3, 500);
};
