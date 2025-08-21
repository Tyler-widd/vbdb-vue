// composables/useAvcaData.js
import { ref, onMounted } from "vue";

export const useAvcaData = () => {
  const avcaData = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchAvcaData = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        "https://api.volleyballdatabased.com/avca_rankings"
      ); // or wherever your data comes from
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      avcaData.value = data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching AVCA data:", err);
    } finally {
      loading.value = false;
    }
  };

  // Helper function to get rankings by division
  const getRankingsByDivision = (division) => {
    return avcaData.value.filter((team) => team.division === division);
  };

  // Helper function to get top N teams by division
  const getTopTeamsByDivision = (division, limit = 25) => {
    return getRankingsByDivision(division)
      .sort((a, b) => parseInt(a.rank) - parseInt(b.rank))
      .slice(0, limit);
  };

  onMounted(() => {
    fetchAvcaData();
  });

  return {
    avcaData,
    loading,
    error,
    fetchAvcaData,
    getRankingsByDivision,
    getTopTeamsByDivision,
  };
};
