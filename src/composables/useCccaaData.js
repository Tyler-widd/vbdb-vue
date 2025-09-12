// composables/useCccaaData.js
import { ref, onMounted } from "vue";
import { vbdbApi } from "@/services/vbdbApi";

export const useCccaaData = () => {
  const loading = ref(false);
  const error = ref(null);
  const cccaaStandings = ref([]);

  const fetchCccaaStandings = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await vbdbApi.getCccaaStandings();
      const data = response.data;
      // Sort by win percentage (highest first)
      cccaaStandings.value = data.sort((a, b) => {
        const aWinPct = a.win_percentage || 0;
        const bWinPct = b.win_percentage || 0;
        return bWinPct - aWinPct;
      });
    } catch (err) {
      console.error("Error fetching CCCAA standings:", err);
      error.value = err.message || err.response?.data?.message || "Failed to fetch CCCAA standings";
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
