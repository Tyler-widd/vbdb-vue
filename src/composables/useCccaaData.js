// composables/useCccaaData.js
import { ref, onMounted } from "vue";

export const useCccaaData = () => {
  const loading = ref(false);
  const error = ref(null);
  const cccaaStandings = ref([]);

  const fetchCccaaStandings = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        "https://api.volleyballdatabased.com/cccaa_standings"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Sort by win percentage (highest first)
      cccaaStandings.value = data.sort((a, b) => {
        const aWinPct = a.win_percentage || 0;
        const bWinPct = b.win_percentage || 0;
        return bWinPct - aWinPct;
      });
    } catch (err) {
      console.error("Error fetching CCCAA standings:", err);
      error.value = err.message;
      cccaaStandings.value = [];
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchCccaaStandings();
  });

  return {
    loading,
    error,
    cccaaStandings,
    fetchCccaaStandings,
  };
};
