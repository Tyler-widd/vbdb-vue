// composables/useGamesData.js
import { ref, onMounted } from "vue";

export function useGamesData() {
  const games = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchGames = async () => {
    loading.value = true;
    error.value = null;

    try {
      // If the JSON file is in your public folder
      const response = await fetch("https://api.volleyballdatabased.com/games");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      games.value = data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching games data:", err);
    } finally {
      loading.value = false;
    }
  };

  // Auto-fetch on mount
  onMounted(() => {
    fetchGames();
  });

  return {
    games,
    loading,
    error,
    fetchGames,
  };
}
