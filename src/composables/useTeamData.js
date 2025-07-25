// composables/useTeamsData.js
import { ref, onMounted } from "vue";

export function useTeamsData() {
  const schools = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchTeams = async () => {
    loading.value = true;
    error.value = null;

    try {
      // If the JSON file is in your public folder
      const response = await fetch("/teams.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      schools.value = data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching teams data:", err);
    } finally {
      loading.value = false;
    }
  };

  // Auto-fetch on mount
  onMounted(() => {
    fetchTeams();
  });

  return {
    schools,
    loading,
    error,
    fetchTeams,
  };
}
