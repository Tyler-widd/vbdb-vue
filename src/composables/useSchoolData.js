// composables/useSchoolData.js
import { ref } from "vue";

export default function useSchoolData() {
  const schools = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchSchools = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(
        "https://api.volleyballdatabased.com/schools"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch schools data");
      }
      const data = await response.json();
      schools.value = data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching schools:", err);
    } finally {
      loading.value = false;
    }
  };

  return {
    schools,
    loading,
    error,
    fetchSchools,
  };
}
